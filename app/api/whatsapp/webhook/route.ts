import { recordInbound } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";

// Meta verifies the webhook with a GET challenge.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("forbidden", { status: 403 });
}

// Inbound messages are POSTed here; cache them so the agent can read recent chats.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const changes = body?.entry?.[0]?.changes?.[0]?.value;
    for (const m of changes?.messages ?? []) {
      await recordInbound({
        from: m.from,
        text: m.text?.body ?? `[${m.type}]`,
        at: new Date().toISOString(),
      });
    }
  } catch {
    /* always 200 so Meta doesn't disable the webhook */
  }
  return new Response("ok", { status: 200 });
}
