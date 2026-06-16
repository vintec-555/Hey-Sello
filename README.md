# 🌀 Flowmint

> **Put your busywork on autopilot.**
> Flowmint is an AI automation service that connects the tools you already use and runs the repetitive work for you — follow-ups, data entry, copy-paste between apps. You set the goal, it handles the grind.

This repo contains the **landing page + waitlist** for the launch.

---

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The full landing page (hero, features, how-it-works, CTA). |
| `styles.css` | Bold & friendly visual design — gradients, rounded cards, playful accents. |
| `app.js` | Waitlist form handling (AJAX submit + success/error states). |

It's a **static site** — no build step, no server to run.

---

## 1. Hook up the waitlist (required)

The waitlist posts to [**Formspree**](https://formspree.io) (free tier is fine to start).

1. Create a free account at [formspree.io](https://formspree.io).
2. Create a new form → copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. In `index.html`, replace **both** occurrences of `YOUR_FORM_ID`:
   ```html
   <form ... action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
   with your real form ID (there are two forms — the hero and the bottom CTA — point both at the same endpoint).

That's it — submissions will land in your Formspree dashboard and email you.

> Prefer **Tally**, **Google Forms**, or **Buttondown** instead? Any service that accepts a `POST` with an `email` field works — just swap the `action` URL. Formspree is the default because it returns JSON for the inline success message.

---

## 2. Preview locally

Open `index.html` directly in your browser, or serve it:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 3. Deploy (pick one)

**Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder, or connect this repo. No build command needed; it's static.

**GitHub Pages:**
1. Push to GitHub (already on branch `claude/brave-archimedes-fjiea4`).
2. Repo → Settings → Pages → deploy from branch → root `/`.

---

## Brand cheat-sheet

- **Name:** Flowmint
- **Tagline:** *Put your busywork on autopilot.*
- **Voice:** friendly, plain-spoken, a little playful — "for people with better things to do."
- **Colors:** Violet `#6C5CE7` · Coral `#FF6B6B` · Sunny `#FFD166` · Mint `#4ECDC4` · Ink `#16162B`
- **Mark:** 🌀

Swap the emoji mark for a real logo when you have one (it's in the nav, footer, and favicon in `index.html`).

---

## Next steps to consider

- [ ] Real logo + custom domain (`flowmint.ai` / `.com` / `.io`)
- [ ] Confirm the name is available (domain + trademark + social handles)
- [ ] Add a privacy note / terms link before collecting emails at scale
- [ ] Wire up an email tool (Buttondown, Loops, ConvertKit) for the welcome sequence
- [ ] Analytics (Plausible / Fathom) to track signups
