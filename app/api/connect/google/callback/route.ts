import { exchangeCode } from "@/lib/integrations/gmail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }
  try {
    await exchangeCode(code, `${url.origin}/api/connect/google/callback`);
    return Response.redirect(`${url.origin}/app?connect=gmail_ok`, 302);
  } catch {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }
}
