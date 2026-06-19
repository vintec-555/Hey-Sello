import { gmailConnected, gmailSend } from "@/lib/integrations/gmail";
import { whatsappConfigured, whatsappSend } from "@/lib/integrations/whatsapp";
import { currentUserId } from "@/lib/auth";

export const runtime = "nodejs";

// Performs the actual send — only called when the user clicks "Approve" on a
// reviewed draft, and only for the signed-in user's connected account.
export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });

  const { app, to, subject, body } = (await req.json().catch(() => ({}))) as {
    app?: string;
    to?: string;
    subject?: string;
    body?: string;
  };
  if (!to || !body) return Response.json({ error: "Missing recipient or message." }, { status: 400 });

  try {
    if (app === "gmail") {
      if (!(await gmailConnected(uid))) return Response.json({ error: "Gmail isn't connected." }, { status: 400 });
      await gmailSend(uid, to, subject || "(no subject)", body);
    } else if (app === "whatsapp") {
      if (!whatsappConfigured()) return Response.json({ error: "WhatsApp isn't connected." }, { status: 400 });
      await whatsappSend(to, body);
    } else {
      return Response.json({ error: "Unknown channel." }, { status: 400 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Send failed." }, { status: 502 });
  }
}
