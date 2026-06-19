import { exchangeCode } from "@/lib/integrations/gmail";
import { getStored, setStored } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  if (error || !code || !state) {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }

  const mapping = await getStored<{ uid: string }>(`oauth:${state}`);
  if (!mapping?.uid) {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }

  try {
    await exchangeCode(mapping.uid, code, `${url.origin}/api/connect/google/callback`);
    await setStored(`oauth:${state}`, null); // one-time use
    return Response.redirect(`${url.origin}/app?connect=gmail_ok`, 302);
  } catch {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }
}
