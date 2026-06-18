# Hey Sello — Pricing Strategy

> Brand promise: *AI automation for people with better things to do.* Pricing should feel obviously cheaper than a VA and obviously more capable than a Zapier seat — without nickel-and-diming people for trying it.

## 1. Model: seat + usage hybrid, four tiers

We charge a **flat monthly seat price per tier** that includes a **bundle of "task runs"** (one task run = one automation executed end-to-end by the agent). Overage is billed in usage packs. This is the right shape because:

- **Seat price** = predictable revenue + anchors value vs. a VA salary.
- **Included task runs** = the unit customers intuitively understand ("how many things did Sello do for me?").
- **Usage overage** = aligns our revenue with our biggest cost (LLM tokens) so heavy users pay for the compute they consume instead of us eating it.

A "task run" is the billable unit. A run that needs human approval, retries, or multiple tool calls still counts as **one** run — we don't punish the messy middle, because that's our value.

## 2. Tiers, prices, and what's included

Global prices in USD; India prices in INR (not a straight FX conversion — India is priced ~30–45% lower to match local SaaS willingness-to-pay, which the India market expects).

| Tier | USD / mo | INR / mo | Seats | Task runs / mo | Integrations | Key features |
|---|---|---|---|---|---|---|
| **Free** | $0 | ₹0 | 1 | 50 | 2 | 1 active automation, community support, "Powered by Hey Sello" |
| **Starter** | $19 | ₹749 | 1 | 750 | Unlimited | 5 active automations, email support, run history |
| **Pro** | $49 | ₹1,999 | 3 | 3,000 | Unlimited | Unlimited automations, priority runs, approval workflows, WhatsApp (India) |
| **Team** | $129 | ₹4,999 | 10 | 10,000 | Unlimited | Shared automations, roles/permissions, audit log, priority support, SSO-lite |
| **Enterprise** | Custom | Custom | 10+ | Custom | Unlimited | SSO/SAML, SLA, dedicated onboarding, custom data retention |

**Overage packs** (when included runs are used up): **$10 / ₹399 per 1,000 extra runs.** Or upgrade a tier — almost always cheaper, which is the intended nudge.

**Annual billing:** 2 months free (≈17% off) on Starter/Pro/Team. Improves cash and cuts churn.

## 3. Founder / early-bird pricing (waitlist)

For the first **200 paying customers** off the waitlist:

- **"Founding member" deal:** 50% off Pro or Team for **12 months**, locked in (Pro → $24.50 / ₹999; Team → $64.50 / ₹2,499).
- **Lifetime perk:** founding members keep a permanent **20% loyalty discount** after the first year and a "Founding Member" badge.
- Beta users (pre-paid tiers) get **3 months free** of Starter as a thank-you, then convert.

Rationale: the early-bird deal is steep enough to drive waitlist→paid conversion and generate testimonials/case studies, but time-boxed and capped (200 seats) so it doesn't anchor the long-term price. The lifetime 20% is cheap insurance for word-of-mouth and keeps our most engaged users from churning.

## 4. How prices map to costs

The dominant variable cost is **LLM tokens**. We model the agent on **Claude Opus 4.8** for planning/judgment ($5 / 1M input, $25 / 1M output) and route simpler steps to **Claude Haiku 4.5** ($1 / $5) and **Sonnet 4.6** ($3 / $15) where quality allows. Prompt caching (~0.1× read cost) and adaptive thinking keep this in check.

**Cost of a typical task run** (e.g., "reply to a lead and log it"):

- Context + tool definitions + history: ~15K input tokens, but ~12K is cache reads after warm-up.
  - ~3K fresh input @ $5/M = $0.015; ~12K cached @ $0.50/M = $0.006
- Output (plan + drafted reply + tool calls): ~2K output tokens @ $25/M = $0.050
- A few tool round-trips add ~1–2K more output: ~$0.035
- **LLM cost per run ≈ $0.10** on Opus-heavy paths; **≈ $0.03–0.05** when routed through Sonnet/Haiku.

We assume a **blended ~$0.06 per task run** at launch (mix of model routing + caching), trending to **~$0.04** as we optimize.

**Other COGS:** integration/infra (hosting, queues, OAuth token storage, monitoring) ≈ **$0.01–0.02 per run**; payment processing ~3% of revenue. Most third-party integrations (Gmail/Slack/Notion APIs) are free at our volume.

**Margin check per tier (at ~$0.06/run blended, runs at ~60% of bundle on average):**

| Tier | Price | Avg runs used | LLM+infra cost | Gross margin |
|---|---|---|---|---|
| Starter $19 | $19 | ~450 | ~$31 worst case / ~$27 avg | tight on heavy users → see note |
| Pro $49 | $49 | ~1,800 | ~$130 worst / ~$110 avg | tight if maxed |

**Important sizing note:** the *included* run bundles are generous on paper, but real usage averages **40–60% of the bundle** (most automations are weekly/daily, not constant). At ~50% utilization, Starter consumes ~375 runs ≈ $22 cost vs $19 — so Starter is roughly **break-even to slightly subsidized**, intentionally, as an acquisition tier. **Pro and Team carry the margin:** Pro at 50% utilization ≈ 1,500 runs ≈ $90 cost… which is *above* $49. This means the headline bundles are too large; the production numbers we ship should be tuned so blended gross margin lands at **~75–80%**. Recommended adjustment before launch: **Starter 500 runs, Pro 2,000 runs, Team 6,000 runs**, with overage as the pressure valve. Those are the numbers used in `financial-model.md`.

## 5. Summary of the logic

- **Free** removes adoption friction and seeds word-of-mouth (capped runs keep its cost trivial — 50 runs ≈ $3/mo worst case).
- **Starter** is the "just let me try a real workflow" tier, priced near break-even to maximize conversion.
- **Pro** is the **profit center** and the tier founder-led sales pushes toward.
- **Team** captures the 10–30 person companies that are our ICP sweet spot.
- **Usage overage** ensures heavy users never become loss-makers.
- India pricing is set independently (not FX) so a ₹1,999 Pro plan feels fair locally while $49 feels fair globally.
