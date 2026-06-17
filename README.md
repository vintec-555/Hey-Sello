# ⟳ Sello

> **Work that runs itself.**
> Sello is an AI automation service that connects the tools you already use and runs the repetitive work for you — follow-ups, data entry, copy-paste between apps. Just say the word ("Hey Sello…") and it handles the grind.

**Domain:** [heysello.in](https://heysello.in)

This repo contains the **landing page + waitlist** for the launch.

---

## What's here

| File | Purpose |
|------|---------|
| `index.html` | The full landing page (hero, features, how-it-works, FAQ, CTA). |
| `styles.css` | Bold & friendly visual design — gradients, rounded cards, playful accents. |
| `app.js` | Waitlist form handling (AJAX submit + success/error states). |

It's a **static site** — no build step, no server to run.

---

## 1. Hook up the waitlist (required)

The waitlist posts to [**Formspree**](https://formspree.io) (free tier is fine to start).

1. Create a free account at [formspree.io](https://formspree.io).
2. Create a new form → copy its endpoint, e.g. `https://formspree.io/f/abcdwxyz`.
3. Open `app.js` and set the ID at the top — **one line, one place**:
   ```js
   var FORMSPREE_ID = "abcdwxyz"; // <- your real ID
   ```
   Both forms (hero + bottom CTA) pick it up automatically.

That's it — submissions land in your Formspree dashboard and email you. Until the
ID is set, the forms show a friendly "not connected yet" note instead of failing.

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
1. Push to GitHub.
2. Repo → Settings → Pages → deploy from branch → root `/`.

---

## Brand cheat-sheet

- **Name:** Sello  *(friendly, conversational — "Hey Sello…" and it's handled)*
- **Domain:** heysello.in
- **Tagline:** *Work that runs itself.*
- **Voice:** friendly, plain-spoken, a little playful — "for people with better things to do."
- **Colors:** Violet `#6C5CE7` · Coral `#FF6B6B` · Sunny `#FFD166` · Mint `#4ECDC4` · Ink `#16162B`
- **Mark:** ⟳

Swap the glyph mark for a real logo when you have one (it's in the nav, footer, and favicon in `index.html`).

---

## Next steps to consider

- [ ] Point `heysello.in` at the deployed site + add a real logo
- [ ] **Before public launch:** formal trademark search (USPTO + India IP) — web search isn't enough
- [ ] Grab matching social handles (@heysello / @sello)
- [x] Basic privacy reassurance microcopy is on the page; add a full privacy policy / terms link before collecting emails at scale
- [ ] Wire up an email tool (Buttondown, Loops, ConvertKit) for the welcome sequence
- [ ] Analytics (Plausible / Fathom) to track signups
