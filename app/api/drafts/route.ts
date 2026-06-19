import { gmailConnected, gmailSend } from "@/lib/integrations/gmail";
import { getStored, setStored } from "@/lib/store";
import type { PendingDraft } from "@/app/api/cron/poll/route";

export const runtime = "nodejs";

// List the drafts Sello prepared automatically (awaiting the owner's approval).
export async function GET() {
  const all = (await getStored<PendingDraft[]>("pending_drafts")) ?? [];
  return Response.json({ drafts: all.filter((d) => d.status === "pending") });
}

// Approve (send) or discard a queued draft. Sending happens here, server-side,
// using the exact stored text — only on the owner's explicit action.
export async function POST(req: Request) {
  const { id, action } = (await req.json().catch(() => ({}))) as { id?: string; action?: "approve" | "discard" };
  if (!id || !action) return Response.json({ error: "Missing id or action." }, { status: 400 });

  const all = (await getStored<PendingDraft[]>("pending_drafts")) ?? [];
  const draft = all.find((d) => d.id === id);
  if (!draft) return Response.json({ error: "Draft not found." }, { status: 404 });

  if (action === "approve") {
    if (!(await gmailConnected())) return Response.json({ error: "Gmail isn't connected." }, { status: 400 });
    try {
      await gmailSend(draft.fromEmail, draft.replySubject, draft.replyBody);
      draft.status = "sent";
    } catch (e) {
      return Response.json({ error: e instanceof Error ? e.message : "Send failed." }, { status: 502 });
    }
  } else {
    draft.status = "discarded";
  }

  await setStored("pending_drafts", all);
  return Response.json({ ok: true });
}
