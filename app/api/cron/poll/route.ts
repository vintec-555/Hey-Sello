import { gmailConnected, gmailSearch } from "@/lib/integrations/gmail";
import { generateReply, extractEmail } from "@/lib/draft";
import { getStored, getU, setU, durable } from "@/lib/store";

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

const MAX_PER_USER = 3; // keep each run fast + cost-bounded

// Runs on a schedule. For every signed-up user with Gmail connected, checks for
// new unread messages and auto-drafts a reply — queued for that user's approval.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const ok = req.headers.get("authorization") === `Bearer ${secret}` || url.searchParams.get("key") === secret;
    if (!ok) return new Response("Unauthorized", { status: 401 });
  }
  if (!durable()) {
    return Response.json({ ok: false, error: "No durable store configured." }, { status: 503 });
  }

  const users = (await getStored<string[]>("users")) ?? [];
  let totalDrafted = 0;

  for (const uid of users) {
    if (!(await gmailConnected(uid))) continue;

    const { messages } = await gmailSearch(uid, "is:unread", 10);
    const processed = (await getU<string[]>(uid, "gmail_processed")) ?? [];
    const seen = new Set(processed);
    const fresh = messages.filter((m) => !seen.has(m.id)).slice(0, MAX_PER_USER);

    const drafts = (await getU<PendingDraft[]>(uid, "pending_drafts")) ?? [];
    for (const m of fresh) {
      const body = await generateReply(uid, { from: m.from, subject: m.subject, snippet: m.snippet });
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
      totalDrafted++;
    }

    await setU(uid, "pending_drafts", drafts.slice(0, 100));
    await setU(uid, "gmail_processed", [...fresh.map((m) => m.id), ...processed].slice(0, 300));
  }

  return Response.json({ ok: true, users: users.length, drafted: totalDrafted });
}
