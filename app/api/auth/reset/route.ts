import { NextResponse } from "next/server";
import { consumeResetToken, setPassword, createSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token, password } = (await req.json().catch(() => ({}))) as { token?: string; password?: string };
  if (!token || !password || password.length < 6) {
    return NextResponse.json({ error: "Invalid request — password must be at least 6 characters." }, { status: 400 });
  }
  const userId = await consumeResetToken(token);
  if (!userId) return NextResponse.json({ error: "This reset link is invalid or expired." }, { status: 400 });

  await setPassword(userId, password);
  const session = await createSession(userId);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, session, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
