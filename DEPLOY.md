# Deploying Hey Sello

Two ways to get auto-deploy. **Option A is recommended** — less setup, plus a
preview URL for every pull request.

---

## Option A — Vercel native Git integration (recommended)

One-time setup, then every push auto-deploys.

1. Go to **https://vercel.com/new** and **Import** the `vintec-555/Hey-Sello` repo
   (authorize GitHub if asked). Vercel auto-detects Next.js — no settings to change.
2. **Settings → Git → Production Branch:** set it to `claude/adoring-goldberg-jos3wv`
   (or merge that branch into `main` and deploy `main`).
3. **Settings → Environment Variables:** add the ones you have
   (`ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`, `FORMSPREE_ID`).
4. Deploy. You now get a live URL (e.g. `hey-sello.vercel.app`); every `git push`
   redeploys automatically, and every PR gets its own preview URL.

Then come back and fill the real URL into Google's redirect URI and Meta's
webhook (see `INTEGRATIONS.md`).

---

## Option B — GitHub Actions (already wired in this repo)

`.github/workflows/deploy.yml` deploys on every push. It stays **dormant** until
you enable it, so it won't fail in the meantime.

1. Create the Vercel project once and grab its IDs:
   ```bash
   npm i -g vercel
   vercel link        # creates .vercel/project.json with orgId + projectId
   cat .vercel/project.json
   ```
2. In **GitHub → repo → Settings → Secrets and variables → Actions**, add:
   - **Secrets:** `VERCEL_TOKEN` (from https://vercel.com/account/tokens),
     `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
   - **Variable:** `ENABLE_VERCEL_DEPLOY` = `true`
3. Add the app's env vars (`ANTHROPIC_API_KEY`, etc.) in the **Vercel** project
   settings (the workflow pulls them at build time).
4. Push — the workflow builds and deploys to production.

To pause it, set `ENABLE_VERCEL_DEPLOY` to anything but `true` (the job skips).
