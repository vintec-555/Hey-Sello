import { exchangeCode } from "@/lib/integrations/gmail";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }

  let refresh = "";
  try {
    refresh = await exchangeCode(code, `${url.origin}/api/connect/google/callback`);
  } catch {
    return Response.redirect(`${url.origin}/app?connect=gmail_failed`, 302);
  }

  // If the durable refresh token is already configured (or Google didn't return
  // a new one), the connection works across all servers — go straight to the app.
  if (process.env.GOOGLE_REFRESH_TOKEN || !refresh) {
    return Response.redirect(`${url.origin}/app?connect=gmail_ok`, 302);
  }

  // First connect: show the refresh token so it can be saved as an env var.
  // On serverless, only an env var persists across instances.
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Gmail connected — one more step</title>
<style>
 body{font-family:system-ui,-apple-system,sans-serif;background:#fffdf7;color:#16162b;max-width:620px;margin:0 auto;padding:40px 24px;line-height:1.6}
 h1{font-size:1.5rem} code,.tok{font-family:ui-monospace,monospace}
 .tok{display:block;background:#fff;border:1px solid #e6e3da;border-radius:12px;padding:14px;word-break:break-all;font-size:.85rem;margin:14px 0}
 .step{background:#fff;border:1px solid #e6e3da;border-radius:12px;padding:16px 18px;margin:12px 0}
 b{color:#6c5ce7} a.btn{display:inline-block;background:#6c5ce7;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;margin-top:8px}
 button{font:inherit;cursor:pointer;background:#16162b;color:#fff;border:none;border-radius:8px;padding:8px 14px}
</style></head><body>
 <h1>✅ Gmail authorized — one quick step to make it stick</h1>
 <p>Because Hey Sello runs on Vercel's serverless servers, the connection only becomes <b>permanent</b> once you save this token as an environment variable. Takes 1 minute.</p>
 <div class="tok" id="t">${refresh}</div>
 <button onclick="navigator.clipboard.writeText(document.getElementById('t').innerText);this.innerText='Copied ✓'">Copy token</button>
 <div class="step"><b>1.</b> In Vercel → your project → <b>Settings → Environment Variables</b>, add:<br/>
   Key: <code>GOOGLE_REFRESH_TOKEN</code><br/>Value: the token above (Production checked) → Save.</div>
 <div class="step"><b>2.</b> <b>Deployments → ⋯ → Redeploy.</b></div>
 <div class="step"><b>3.</b> Done — Gmail stays connected on every server, for good.</div>
 <p style="opacity:.7;font-size:.85rem">Keep this token private — it grants access to the connected Gmail account.</p>
 <a class="btn" href="/app">Continue to the app →</a>
</body></html>`;

  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
