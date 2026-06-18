import { gmailConnected, googleConfigured } from "@/lib/integrations/gmail";
import { whatsappConfigured } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    agent: Boolean(process.env.ANTHROPIC_API_KEY),
    gmail: {
      configured: googleConfigured(),
      connected: await gmailConnected(),
    },
    whatsapp: {
      configured: whatsappConfigured(),
      connected: whatsappConfigured(),
    },
  });
}
