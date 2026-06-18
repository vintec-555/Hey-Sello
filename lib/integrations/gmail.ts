// Real Gmail integration via Google OAuth 2.0 + the Gmail REST API.
// No SDK dependency — plain fetch, so it deploys anywhere.
//
// Setup (see INTEGRATIONS.md): create a Google Cloud OAuth client, set
// GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, add the redirect URI, then either
// run the in-app "Connect Gmail" flow (local) or paste a GOOGLE_REFRESH_TOKEN
// (production single-account).
import { getStored, setStored } from "@/lib/store";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

type Tokens = { refresh_token: string; access_token?: string; expiry?: number };

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

async function loadTokens(): Promise<Tokens | null> {
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    const stored = await getStored<Tokens>("google");
    return { refresh_token: process.env.GOOGLE_REFRESH_TOKEN, ...(stored ?? {}) };
  }
  return getStored<Tokens>("google");
}

export async function gmailConnected(): Promise<boolean> {
  if (!googleConfigured()) return false;
  return Boolean(await loadTokens());
}

export function authUrl(redirectUri: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES.join(" "),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string, redirectUri: string): Promise<void> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Token exchange failed");
  await setStored("google", {
    refresh_token: data.refresh_token,
    access_token: data.access_token,
    expiry: Date.now() + (data.expires_in ?? 3600) * 1000,
  });
}

async function accessToken(): Promise<string> {
  const t = await loadTokens();
  if (!t) throw new Error("Gmail not connected");
  if (t.access_token && t.expiry && t.expiry > Date.now() + 60_000) return t.access_token;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: t.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || "Token refresh failed");
  const access = data.access_token as string;
  await setStored("google", { ...t, access_token: access, expiry: Date.now() + (data.expires_in ?? 3600) * 1000 });
  return access;
}

export async function gmailSearch(query: string): Promise<{ id: string; from: string; subject: string; snippet: string }[]> {
  const token = await accessToken();
  const list = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());

  const ids: { id: string }[] = list.messages ?? [];
  const out = [];
  for (const { id } of ids.slice(0, 10)) {
    const msg = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${token}` } },
    ).then((r) => r.json());
    const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
    const h = (n: string) => headers.find((x) => x.name.toLowerCase() === n)?.value ?? "";
    out.push({ id, from: h("from"), subject: h("subject"), snippet: msg.snippet ?? "" });
  }
  return out;
}

export async function gmailSend(to: string, subject: string, body: string): Promise<void> {
  const token = await accessToken();
  const mime = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/plain; charset=utf-8", "", body].join("\r\n");
  const raw = Buffer.from(mime).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) throw new Error((await res.json()).error?.message || "Gmail send failed");
}
