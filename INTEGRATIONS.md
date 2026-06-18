# Connecting Hey Sello to real Gmail & WhatsApp

Out of the box the agent only runs the **simulated preview** (sends nothing).
To make it take real actions, connect the accounts below. Each tool refuses to
run — and says so — until its integration is connected, so nothing is ever
faked.

---

## Gmail (read + send real email)

1. **Google Cloud project** → [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → Enable APIs** → enable the **Gmail API**.
3. **OAuth consent screen** → External; add your Google account as a **Test user**
   (no verification needed while testing).
4. **Credentials → Create OAuth client ID → Web application.**
   - Authorized redirect URI: `https://YOUR_SITE/api/connect/google/callback`
     (and `http://localhost:3000/api/connect/google/callback` for local dev).
5. Put the client ID/secret in your env:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
6. **Connect:** open `/app` and click **Connect** on the Gmail chip → Google
   consent → you're redirected back connected.
7. **Production (Vercel):** serverless filesystems are ephemeral, so after
   connecting once locally, copy the refresh token into `GOOGLE_REFRESH_TOKEN`
   (printed to the dev server logs / stored in the temp connections file) so it
   persists across instances.

Scopes used: `gmail.readonly` + `gmail.send` (read and reply only — no delete).

---

## WhatsApp (send + receive via Meta Cloud API)

1. **Meta app** → [developers.facebook.com](https://developers.facebook.com) →
   create an app → add the **WhatsApp** product.
2. **WhatsApp → API setup**: note the **temporary access token** and the
   **Phone number ID**. (For production, create a permanent System User token.)
   ```
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_ID=...
   WHATSAPP_VERIFY_TOKEN=any-string-you-choose
   ```
3. **Receive messages (optional):** in **WhatsApp → Configuration → Webhook**,
   set the callback URL to `https://YOUR_SITE/api/whatsapp/webhook` and the
   verify token to your `WHATSAPP_VERIFY_TOKEN`, then subscribe to `messages`.
   Inbound messages are cached so the `whatsapp_recent` tool can read them.
4. Sending works as soon as the token + phone ID are set. (During Meta testing,
   you can only message numbers you've added as recipients.)

---

## Verifying

- `/app` shows a connection chip per integration (green = connected).
- `GET /api/connections` returns the live status as JSON.
- Run a real task; if something isn't connected, the agent tells you which app
  to connect instead of inventing a result.

> ⚠️ These send **real** messages from your accounts. Test with your own
> address/number first, and add rate limits / a confirmation step before
> pointing it at customers.
