import { gmailConnected, gmailSend } from "@/lib/integrations/gmail";
import { whatsappConfigured, whatsappSend } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";

// Performs the actual send — only called when the user clicks "Approve" on a
// reviewed draft. Keeps real sends behind an explicit human action.
export async function POST(req: Request) {
  const { app, to, subject, body } = (await req.json().catch(() => ({}))) as {
    app?: string;
    to?: string;
    subject?: string;
    body?: string;
  };
  if (!to || !body) return Response.json({ error: "Missing recipient or message." }, { status: 400 });

  try {
    if (app === "gmail") {
      if (!(await gmailConnected())) return Response.json({ error: "Gmail isn't connected." }, { status: 400 });
      await gmailSend(to, subject || "(no subject)", body);
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
