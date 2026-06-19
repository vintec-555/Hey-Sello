import { gmailConnected, googleConfigured } from "@/lib/integrations/gmail";
import { whatsappConfigured } from "@/lib/integrations/whatsapp";
import { currentUserId, currentUserEmail } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  return Response.json({
    email: await currentUserEmail(uid),
    agent: Boolean(process.env.ANTHROPIC_API_KEY),
    gmail: {
      configured: googleConfigured(),
      connected: await gmailConnected(uid),
    },
    whatsapp: {
      configured: whatsappConfigured(),
      connected: whatsappConfigured(),
    },
    voice: { premium: Boolean(process.env.ELEVENLABS_API_KEY) },
  });
}
