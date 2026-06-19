import { authUrl, googleConfigured } from "@/lib/integrations/gmail";
import { currentUserId } from "@/lib/auth";
import { setStored } from "@/lib/store";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!googleConfigured()) {
    return Response.json(
      { error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 503 },
    );
  }
  const uid = await currentUserId();
  if (!uid) return Response.redirect(`${new URL(req.url).origin}/login`, 302);

  // Short-lived state nonce → user id, so the callback knows whose Gmail this is.
  const state = randomBytes(16).toString("hex");
  await setStored(`oauth:${state}`, { uid });

  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/connect/google/callback`;
  return Response.redirect(authUrl(redirectUri, state), 302);
}
