import { recordInbound } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";

// Twilio posts inbound WhatsApp messages here (form-encoded). We cache them so
// the agent can read recent chats. Set this URL as the sandbox's "When a
// message comes in" webhook in the Twilio console.
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const from = String(form.get("From") || "").replace(/^whatsapp:/, "");
    const text = String(form.get("Body") || "");
    if (from && text) await recordInbound({ from, text, at: new Date().toISOString() });
  } catch {
    /* ignore — always return 200 so Twilio doesn't retry-storm */
  }
  // Empty TwiML = received, no auto-reply.
  return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
