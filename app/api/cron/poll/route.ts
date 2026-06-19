import { gmailConnected, gmailSearch } from "@/lib/integrations/gmail";
import { generateReply, extractEmail } from "@/lib/draft";
import { getStored, setStored, durable } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export type PendingDraft = {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  replySubject: string;
  replyBody: string;
  createdAt: string;
  status: "pending" | "sent" | "discarded";
};

const MAX_PER_RUN = 3; // keep each run fast + cost-bounded

// Called on a schedule (Vercel Cron or an external cron). Checks Gmail for new
// unread messages and auto-drafts a reply for each — queued for the owner's
// approval. Never sends on its own.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
    if (!ok) return new Response("Unauthorized", { status: 401 });
  }

  if (!durable()) {
    return Response.json({ ok: false, error: "No durable store configured (set KV / Upstash env vars)." }, { status: 503 });
  }
  if (!(await gmailConnected())) {
    return Response.json({ ok: false, error: "Gmail not connected." });
  }

  const { messages } = await gmailSearch("is:unread", 10);
  const processed = (await getStored<string[]>("gmail_processed")) ?? [];
  const seen = new Set(processed);
  const fresh = messages.filter((m) => !seen.has(m.id)).slice(0, MAX_PER_RUN);

  const drafts = (await getStored<PendingDraft[]>("pending_drafts")) ?? [];
  let drafted = 0;

  for (const m of fresh) {
    const body = await generateReply({ from: m.from, subject: m.subject, snippet: m.snippet });
    if (!body) continue;
    drafts.unshift({
      id: m.id,
      from: m.from,
      fromEmail: extractEmail(m.from),
      subject: m.subject,
      snippet: m.snippet,
      replySubject: m.subject.toLowerCase().startsWith("re:") ? m.subject : `Re: ${m.subject}`,
      replyBody: body,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    drafted++;
  }

  await setStored("pending_drafts", drafts.slice(0, 100));
  await setStored("gmail_processed", [...fresh.map((m) => m.id), ...processed].slice(0, 300));

  return Response.json({ ok: true, checked: messages.length, drafted });
}
