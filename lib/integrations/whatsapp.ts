// WhatsApp integration — supports Twilio (easiest, no Facebook) or the Meta
// WhatsApp Cloud API. Whichever is configured is used; Twilio takes priority.
//
// Twilio (recommended): set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
//   TWILIO_WHATSAPP_FROM (e.g. "whatsapp:+14155238886"). Inbound → /api/whatsapp/twilio.
// Meta: set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID. Inbound → /api/whatsapp/webhook.
import { getStored, setStored } from "@/lib/store";

const GRAPH = "https://graph.facebook.com/v21.0";

function metaConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM,
  );
}

export function whatsappConfigured(): boolean {
  return twilioConfigured() || metaConfigured();
}

async function twilioSend(to: string, text: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WHATSAPP_FROM!.startsWith("whatsapp:")
    ? process.env.TWILIO_WHATSAPP_FROM!
    : `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`;
  const dest = to.startsWith("whatsapp:") ? to : `whatsapp:${to.replace(/\s/g, "")}`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: dest, Body: text }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || "Twilio WhatsApp send failed");
}

async function metaSend(to: string, text: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!res.ok) throw new Error((await res.json())?.error?.message || "WhatsApp send failed");
}

export async function whatsappSend(to: string, text: string): Promise<void> {
  if (twilioConfigured()) return twilioSend(to, text);
  if (metaConfigured()) return metaSend(to, text);
  throw new Error("WhatsApp not configured");
}

export type WaMessage = { from: string; text: string; at: string };

export async function recordInbound(msg: WaMessage): Promise<void> {
  const list = (await getStored<WaMessage[]>("whatsapp_inbox")) ?? [];
  list.unshift(msg);
  await setStored("whatsapp_inbox", list.slice(0, 50));
}

export async function whatsappRecent(query?: string): Promise<WaMessage[]> {
  const list = (await getStored<WaMessage[]>("whatsapp_inbox")) ?? [];
  if (!query) return list.slice(0, 10);
  const q = query.toLowerCase();
  return list.filter((m) => m.text.toLowerCase().includes(q) || m.from.includes(q)).slice(0, 10);
}
