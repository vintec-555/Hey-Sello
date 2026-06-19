import { NextResponse } from "next/server";
import { verifyUser, createSession, SESSION_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: "Email and password required." }, { status: 400 });

  const user = await verifyUser(email, password);
  if (!user) return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });

  const token = await createSession(user.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
