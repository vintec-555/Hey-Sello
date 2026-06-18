# ⟳ Hey Sello

> **Work that runs itself.**
> Hey Sello is an AI automation service that connects the tools you already use and runs the repetitive work for you — follow-ups, data entry, copy-paste between apps. Just say the word ("Hey Sello…") and it handles the grind.

**Domain:** [heysello.in](https://heysello.in)

This repo is the full Hey Sello product: a marketing site, a waitlist, and a working **AI agent** that runs tasks across your apps in plain English.

---

## What's here

A **Next.js (App Router) + TypeScript** app, deployable to Vercel.

| Path | What it is |
|------|------------|
| `app/page.tsx` | Marketing landing page (hero, features, how-it-works, FAQ, waitlist). |
| `app/app/page.tsx` | **The product** — a chat console where you type a task and watch Sello run it step by step. |
| `app/api/agent/route.ts` | The agent backend — a Claude tool-use loop that plans and executes across the tools. Streams each step (SSE). |
| `app/api/waitlist/route.ts` | Waitlist signup API (file store + optional Formspree forward). |
| `lib/tools.ts` | The agent's tool surface (Gmail / Slack / Notion / CRM). |
| `app/globals.css` | The full visual design. |
| `business/` | Business foundation docs — GTM, pricing, financial model, legal checklist. |

---

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000  (marketing)  ·  /app  (product)
```

The product works out of the box in **Demo mode** — it runs against in-memory
fixtures so you can explore the full flow with no keys.

### Go live (real agent)

Set an Anthropic API key and the same console runs the **real Claude agent**:

```bash
cp .env.example .env.local
# then edit .env.local:
ANTHROPIC_API_KEY=sk-ant-...
```

Restart and `/app` flips to **Live agent** — Claude (`claude-opus-4-8`) plans
and calls the tools itself. To make those tools touch *real* Gmail/Slack/etc.,
replace each executor's body in `lib/tools.ts` with a real API call (the tool
schema the model sees stays the same).

### Waitlist

Signups are stored to a JSON file by default. To also get email + a dashboard,
create a form at [formspree.io](https://formspree.io) and set `FORMSPREE_ID` in
`.env.local`. For production scale, swap the file store in
`app/api/waitlist/route.ts` for Postgres or a KV store.

---

## Deploy

**Vercel** (recommended): import the repo, add `ANTHROPIC_API_KEY` (and
optionally `FORMSPREE_ID`) as environment variables, deploy. Then point
**heysello.in** at it in the domain settings (free SSL is issued automatically).

```bash
npm run build && npm run start   # to verify a production build locally
```

---

## Brand cheat-sheet

- **Name:** Hey Sello  *(friendly, conversational — "Hey Sello…" and it's handled)*
- **Domain:** heysello.in
- **Tagline:** *Work that runs itself.*
- **Voice:** friendly, plain-spoken, a little playful — "for people with better things to do."
- **Colors:** Violet `#6C5CE7` · Coral `#FF6B6B` · Sunny `#FFD166` · Mint `#4ECDC4` · Ink `#16162B`
- **Mark:** ⟳

---

## Roadmap to launch

- [ ] Add `ANTHROPIC_API_KEY` in your deploy env to switch the agent to live
- [ ] Wire real OAuth integrations in `lib/tools.ts` (Gmail, Slack, Notion, CRM)
- [ ] Replace the waitlist file store with a real DB; add a welcome email
- [ ] Point `heysello.in` at the deployment + add a real logo
- [ ] **Before public launch:** formal trademark search (USPTO + India IP)
- [ ] Grab matching social handles (@heysello / @sello)
- [ ] Add analytics (Plausible / Fathom)
- [ ] See `business/` for GTM, pricing, financial model, and the legal checklist
