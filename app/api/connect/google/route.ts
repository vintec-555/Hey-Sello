import { authUrl, googleConfigured } from "@/lib/integrations/gmail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return Response.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 },
    );
  }
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/connect/google/callback`;
  return Response.redirect(authUrl(redirectUri), 302);
}
