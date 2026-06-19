import { NextResponse } from "next/server";
import { getStored, setStored } from "@/lib/store";
import { findOrCreateOAuthUser, createSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || !(await getStored(`gauth:${state}`))) {
    return NextResponse.redirect(`${url.origin}/login?e=google_failed`, 302);
  }
  await setStored(`gauth:${state}`, null);

  try {
    const tok = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    }).then((r) => r.json());
    if (!tok.access_token) throw new Error("no token");

    const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    }).then((r) => r.json());
    if (!info.email) throw new Error("no email");

    const user = await findOrCreateOAuthUser(info.email);
    const session = await createSession(user.id);
    const res = NextResponse.redirect(`${url.origin}/app`, 302);
    res.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.redirect(`${url.origin}/login?e=google_failed`, 302);
  }
}
