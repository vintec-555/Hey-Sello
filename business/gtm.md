# Hey Sello — Go-to-Market & Launch Plan

## 1. Ideal Customer Profile (ICP)

We are not selling to enterprises and not to solo consumers. We sell to small, fast teams that have more work than people.

**Firmographics**
- **Company size:** 5–50 employees (sweet spot 10–30).
- **Stage:** seed to Series A startups, bootstrapped SaaS, small agencies, D2C brands, B2B services.
- **Geography (launch):** India + English-speaking global SMB (US, UK, EU, SEA, Middle East). India first because the .in domain, founder network, and price sensitivity all line up; global because willingness-to-pay is higher.

**Who actually buys / uses it (the human)**
| Persona | Pain | What they want Sello to do |
|---|---|---|
| **Founder / co-founder** | Doing 5 jobs, inbox is a graveyard | "Just handle the follow-ups and tell me what needs me." |
| **Ops / Chief of Staff** | Glue work across 8 tools | Stitch Gmail ↔ Notion ↔ Sheets ↔ Slack without code. |
| **Sales / SDR lead** | Leads go cold, CRM is half-empty | Reply to inbound fast, log everything, never drop a lead. |
| **Customer Success** | Repetitive ticket triage & updates | Draft replies, tag, escalate, summarize. |

**Tools they already live in (our integration priority order):** Gmail/Google Workspace, Slack, Notion, Google Sheets, HubSpot/Pipedrive/Zoho CRM, Calendly/Google Calendar, WhatsApp Business (India-specific, high value).

**Qualifying signals (good fit):** uses Gmail + at least one CRM or Notion/Sheets; team feels "drowning in repetitive work"; no engineer to spare; already tried and bounced off Zapier or hired a part-time VA.

**Anti-ICP:** regulated enterprises needing SOC 2 day one, teams wanting deterministic no-AI pipelines, individuals wanting a personal assistant only.

## 2. Wedge Use-Cases (launch with 4)

We launch narrow and excellent, not broad and shallow. Each wedge is a complete, demoable automation a non-technical person can turn on in under 10 minutes.

1. **Lead response & logging** — "Reply to new inbound leads within 5 minutes, qualify them, and log them in the CRM." Touches Gmail/web form → Claude drafts/sends reply → writes to HubSpot/Sheets. This is the headline demo: speed-to-lead is a number teams already obsess over.
2. **Inbox triage & draft replies** — "Sort my inbox, draft replies to the routine stuff, flag what needs me." High daily frequency = habit-forming = retention.
3. **Meeting → notes → CRM/tasks** — "After every sales call, summarize it, update the deal in the CRM, and create my follow-up tasks." Connects calendar + transcript + CRM + Notion.
4. **Recurring reports & digests** — "Every Monday 9am, pull last week's numbers from Sheets/CRM and post a summary in Slack." Predictable, low-risk, builds trust before we touch outbound email.

We deliberately start with **read + draft + log** actions and ease into **send/act-on-your-behalf**, because trust is the real product.

## 3. Positioning vs. Alternatives

**Tagline:** *AI automation for people with better things to do.*

**One-liner:** Tell Sello what you want in plain English; it connects your tools and actually does the work — no flowcharts, no VA to train, no copy-pasting into a chatbot.

| Alternative | Their pitch | Where it breaks | Our wedge |
|---|---|---|---|
| **Zapier / Make** | Connect apps with triggers | You build the logic. Rigid, breaks on edge cases, no judgment. | We *understand intent* and handle the messy middle. No flowchart to build. |
| **Hiring a VA** | A human does it | $400–1,500/mo, hiring + training + management, sick days, ramp time. | Always on, instant, consistent, fraction of the cost, no management. |
| **ChatGPT / Claude copy-paste** | A smart assistant in a tab | Not connected to your tools; you're the integration; nothing runs while you sleep. | Connected and autonomous. It runs end-to-end, not just suggests. |
| **AI features inside the CRM** | "AI in HubSpot" | Locked to one tool; can't cross apps. | Cross-tool, tool-agnostic, follows *your* workflow. |

**Why we win the wedge:** Zapier owns "if-this-then-that," we own "just get it done." The moat is the combination of (a) natural-language task definition, (b) cross-tool agency, and (c) trust earned through transparent, reversible actions.

## 4. Channels

Ranked by expected efficiency for the first 12 months.

1. **Waitlist → beta cohorts.** Landing page on heysello.in collecting emails + "what would you automate?" (this doubles as demand research). Invite in weekly cohorts of 20–30 so support and onboarding stay tight.
2. **Founder-led sales.** Founders personally onboard the first 50–100 customers over video calls. Every call is a discovery interview. This is the highest-signal channel early and is non-negotiable.
3. **Communities (India + global).** Where our ICP already hangs out: r/SaaS, r/startups, Indie Hackers, MicroConf, on-deck/founder Slacks, India: relevant founder WhatsApp/Telegram groups, SaaSBOOMi, regional startup communities. Show real before/afters, never spam.
4. **Content / SEO.** Bottom-funnel intent: "automate lead response," "Zapier alternative for [use-case]," "how to reply to leads in 5 minutes." Publish playbooks ("the 5-minute speed-to-lead automation") that double as demos. Compounds over months.
5. **Partnerships.** CRM/agency partners (HubSpot/Pipedrive solution partners, marketing agencies serving SMBs) who can resell or refer. India: agencies and fractional-ops providers.
6. **Build in public.** Founder posts on LinkedIn/X documenting the build and customer wins. Cheap, on-brand, recruits both users and beta feedback.

## 5. 90-Day Launch Timeline

**Phase 0 — Foundations (pre-day 1):** legal entity, ToS/Privacy, landing page, OAuth apps (Gmail/Slack) in dev, the 4 wedge automations working in a controlled demo.

### Days 1–30: Waitlist & Private Alpha
- Launch landing page + waitlist. Goal: **1,000 signups**.
- Run 25–40 founder discovery calls; refine the wedge order from real demand.
- Hand-built private alpha with **10 design partners** (free, white-glove). Founders are in the loop on every run.
- **Milestone:** 10 design partners with at least 1 automation running daily; 1,000 waitlist emails.

### Days 31–60: Closed Beta
- Open beta to cohorts of 20–30/week from the waitlist (target ~80–100 active beta users).
- Ship self-serve onboarding for the 4 wedge use-cases; instrument activation.
- Introduce **founder/early-bird pricing** (see pricing.md) to gauge willingness-to-pay; collect cards from a subset.
- Publish 4–6 SEO/playbook posts; start communities cadence.
- **Milestone:** ≥40% of activated beta users running a weekly automation; ≥10 verbal "I'd pay" + first 10 paying early-birds.

### Days 61–90: Paid Launch
- Public launch (Product Hunt + community + build-in-public push).
- Turn on paid tiers; convert early-birds and beta users.
- First partnership conversations (1–2 agencies/CRM partners).
- **Milestone:** **40–60 paying customers, ~$1.5–2.5k MRR**, documented activation funnel, churn baseline established.

## 6. North-Star & Key Metrics

**North-star metric:** **Weekly Automated Tasks Completed Successfully** (per account). It captures value delivered, not vanity — a user only stays if Sello does real work, reliably, every week.

| # | Metric | Why it matters | Early target |
|---|---|---|---|
| 1 | **Activation rate** = % of signups who connect ≥1 tool AND run ≥1 automation within 48h | The single best predictor of retention | ≥40% |
| 2 | **Weekly active automations / account** (north-star) | Real, recurring value | ≥3 by week 4 |
| 3 | **Task success rate** = completed correctly / attempted | Trust = the product; failures churn users fast | ≥90% |
| 4 | **Week-4 retention** (cohort still active) | Habit formed or not | ≥45% |
| 5 | **Paid conversion** (activated → paying) & **NRR** | The business actually works | ≥8% trial→paid; NRR ≥100% |
