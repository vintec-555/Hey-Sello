import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { getStored, setStored } from "@/lib/store";

// Minimal, self-contained auth: email + password with KV-backed sessions and an
// httpOnly cookie. Passwords are salted + hashed (scrypt). For a larger launch
// this can be swapped for a managed provider, but it's secure enough to start.
export const SESSION_COOKIE = "sello_session";

export type User = { id: string; email: string; salt: string; hash: string; createdAt: string };

function hashPw(pw: string, salt: string): string {
  return scryptSync(pw, salt, 64).toString("hex");
}

export async function createUser(emailRaw: string, password: string): Promise<User> {
  const email = emailRaw.toLowerCase().trim();
  if (await getStored<User>(`user:email:${email}`)) throw new Error("An account with this email already exists.");
  const id = randomBytes(8).toString("hex");
  const salt = randomBytes(16).toString("hex");
  const user: User = { id, email, salt, hash: hashPw(password, salt), createdAt: new Date().toISOString() };
  await setStored(`user:email:${email}`, user);
  await setStored(`user:id:${id}`, { id, email });
  const list = (await getStored<string[]>("users")) ?? [];
  if (!list.includes(id)) {
    list.push(id);
    await setStored("users", list);
  }
  return user;
}

export async function verifyUser(emailRaw: string, password: string): Promise<User | null> {
  const email = emailRaw.toLowerCase().trim();
  const user = await getStored<User>(`user:email:${email}`);
  if (!user) return null;
  const candidate = Buffer.from(hashPw(password, user.salt), "hex");
  const real = Buffer.from(user.hash, "hex");
  if (candidate.length !== real.length || !timingSafeEqual(candidate, real)) return null;
  return user;
}

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await setStored(`session:${token}`, { userId, createdAt: new Date().toISOString() });
  return token;
}

export async function destroySession(token?: string): Promise<void> {
  if (token) await setStored(`session:${token}`, null);
}

// Resolve the logged-in user id from the request cookie. Null if not signed in.
export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await getStored<{ userId: string }>(`session:${token}`);
  return s?.userId ?? null;
}

export async function currentUserEmail(uid: string): Promise<string | null> {
  const u = await getStored<{ email: string }>(`user:id:${uid}`);
  return u?.email ?? null;
}

// ---- Google sign-in (passwordless) + password reset ------------------------

export async function findOrCreateOAuthUser(emailRaw: string): Promise<User> {
  const email = emailRaw.toLowerCase().trim();
  const existing = await getStored<User>(`user:email:${email}`);
  if (existing) return existing;
  const id = randomBytes(8).toString("hex");
  const user: User = { id, email, salt: "", hash: "", createdAt: new Date().toISOString() };
  await setStored(`user:email:${email}`, user);
  await setStored(`user:id:${id}`, { id, email });
  const list = (await getStored<string[]>("users")) ?? [];
  if (!list.includes(id)) {
    list.push(id);
    await setStored("users", list);
  }
  return user;
}

export async function createResetToken(emailRaw: string): Promise<string | null> {
  const email = emailRaw.toLowerCase().trim();
  const user = await getStored<User>(`user:email:${email}`);
  if (!user) return null;
  const token = randomBytes(24).toString("hex");
  await setStored(`reset:${token}`, { userId: user.id, exp: Date.now() + 1000 * 60 * 30 });
  return token;
}

export async function consumeResetToken(token: string): Promise<string | null> {
  const r = await getStored<{ userId: string; exp: number }>(`reset:${token}`);
  if (!r || r.exp < Date.now()) return null;
  await setStored(`reset:${token}`, null);
  return r.userId;
}

export async function setPassword(userId: string, password: string): Promise<boolean> {
  const map = await getStored<{ email: string }>(`user:id:${userId}`);
  if (!map) return false;
  const user = await getStored<User>(`user:email:${map.email}`);
  if (!user) return false;
  user.salt = randomBytes(16).toString("hex");
  user.hash = hashPw(password, user.salt);
  await setStored(`user:email:${user.email}`, user);
  return true;
}
