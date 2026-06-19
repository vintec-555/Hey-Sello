import { setStored } from "@/lib/store";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

// "Continue with Google" — authenticates the user (email/profile only; this is
// separate from connecting their Gmail inbox, which uses different scopes).
export async function GET(req: Request) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(`${new URL(req.url).origin}/login?e=google_off`, 302);
  }
  const origin = new URL(req.url).origin;
  const state = randomBytes(16).toString("hex");
  await setStored(`gauth:${state}`, { t: Date.now() });
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`, 302);
}
