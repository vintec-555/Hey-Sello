// Real WhatsApp integration via the Meta WhatsApp Cloud API.
//
// Setup (see INTEGRATIONS.md): create a Meta app + WhatsApp Business number,
// then set WHATSAPP_TOKEN (access token) and WHATSAPP_PHONE_ID (the phone
// number ID). Inbound messages arrive at /api/whatsapp/webhook and are cached
// so the agent can read recent chats.
import { getStored, setStored } from "@/lib/store";

const GRAPH = "https://graph.facebook.com/v21.0";

export function whatsappConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function whatsappSend(to: string, text: string): Promise<void> {
  if (!whatsappConfigured()) throw new Error("WhatsApp not configured");
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  if (!res.ok) throw new Error((await res.json())?.error?.message || "WhatsApp send failed");
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
