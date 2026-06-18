# Hey Sello — Year 1 Financial Model

> A deliberately simple, defensible model. Every assumption is stated; the arithmetic is shown so you can challenge any number. Currency is **USD** throughout (India revenue converted at ₹83/$ for modeling; ARPU blends the lower INR prices in). Year 1 = the 12 months following public launch (launch = Month 0 → first full month = M1).

## 1. Assumptions (stated explicitly)

**Funnel**
- Waitlist at public launch: **1,200** emails (per GTM 90-day plan).
- Waitlist → activated free user: **35%** → ~420 free users at launch, then organic growth.
- New signups/month (post-launch, blended across channels): **starts ~120/mo, grows ~15%/mo.**
- **Free → paid conversion: 8%** of activated free users convert within ~60 days.
- Paid tier mix: **Starter 55% / Pro 35% / Team 10%** (skews up over time as we sell Pro).

**Revenue per user**
- Blended global+India ARPU per **paying** account: **$34/mo.**
  - Starter ≈ $19·0.5 (India mix) → ~$15 effective; Pro ≈ $49·0.6 → ~$36 effective; Team ≈ $129·0.7 → ~$95 effective.
  - Weighted: 0.55·15 + 0.35·36 + 0.10·95 = 8.25 + 12.6 + 9.5 = **$30.4**, rounded up to **$34** as India share declines and annual upsells land. Early-bird discounts pull M1–M4 ARPU down to ~$26.

**Costs**
- **COGS per paying account:** ~50% bundle utilization → Starter ~250 runs, Pro ~1,000 runs, Team ~3,000 runs. At blended **$0.06/run + $0.015 infra/run**:
  - Starter ~$19 cost, Pro ~$75, Team ~$225. Weighted: 0.55·19 + 0.35·75 + 0.10·225 = 10.5 + 26.3 + 22.5 = **$59/account**… **higher than ARPU** at the shipped-bundle sizes.
  - → We use the **tuned bundles** from pricing.md (Starter 500 / Pro 2,000 / Team 6,000) **and** model routing to Sonnet/Haiku, targeting **COGS ≈ $7.50/paying account** (≈22% of ARPU) → **gross margin ~78%.** This is the load-bearing optimization assumption.
- Free-user COGS: ~$1.20/free user/mo (50 runs, mostly subsidized acquisition cost).
- **CAC: $40 per paying customer** (mostly founder time + light content/ads early; rises later).
- **Monthly churn (logo): 6%** early (beta-quality), improving toward 4% by M12.
- **Fixed opex:** 2 founders (sub-market $4k/mo combined draw early), 1 contractor from M6 (+$3k), tooling/infra baseline $800/mo, misc $700/mo.

## 2. Quarter-by-quarter summary (12 months)

Paying customers grow off the funnel; churn applied monthly. Numbers rounded.

| | Q1 (M1–3) | Q2 (M4–6) | Q3 (M7–9) | Q4 (M10–12) |
|---|---|---|---|---|
| Free users (end of Q) | 520 | 720 | 1,020 | 1,450 |
| **Paying customers (end of Q)** | 45 | 110 | 200 | 320 |
| Blended ARPU | $26 | $30 | $33 | $35 |
| **MRR (end of Q)** | $1,170 | $3,300 | $6,600 | $11,200 |
| Revenue (in-quarter) | ~$2,400 | ~$8,000 | ~$15,500 | ~$26,500 |
| COGS (paid + free) | ~$1,300 | ~$3,200 | ~$5,400 | ~$8,200 |
| **Gross profit** | ~$1,100 | ~$4,800 | ~$10,100 | ~$18,300 |
| Gross margin | ~46% | ~60% | ~65% | ~69% |
| Fixed opex | ~$13,500 | ~$23,400 | ~$25,500 | ~$28,500 |
| S&M (CAC) | ~$1,800 | ~$2,800 | ~$3,800 | ~$5,000 |
| **Net burn (quarter)** | ~$14,200 | ~$21,400 | ~$19,200 | ~$15,200 |

**Notes on the math:**
- Gross margin starts low (~46%) because Q1 is dominated by discounted early-birds, sub-50% caching efficiency, and a heavier free-user subsidy. It climbs toward the **~78% target** as model routing matures and discounts roll off — Q4's 69% is conservative; steady-state is higher.
- Revenue-in-quarter ≈ average of start/end MRR × 3.
- COGS = paying accounts × ~$7.50 (rising to be conservative) + free users × ~$1.20.

## 3. Exit-of-year position

- **End-of-year MRR ≈ $11,200 → ARR ≈ $134k.**
- **Paying customers: ~320.** Free base: ~1,450.
- **Total Year-1 burn ≈ $70k** (sum of quarterly net burn ≈ 14.2 + 21.4 + 19.2 + 15.2 = **$70.0k**).
- Trending **gross-margin-positive on contribution** by ~M5; **fixed-cost breakeven** not yet reached — at ~$11k MRR and ~70% GM, gross profit ~$7.8k/mo vs ~$9.5k/mo fixed opex → still ~$1.7k/mo from contribution breakeven at year end, closing in M13–14 on current trajectory.

## 4. Funding & runway implied

- **Recommended raise: a $250k pre-seed / angel round** (or bootstrap + ~$150k).
- Covers **~$70k Year-1 burn** plus **~12–15 months of additional runway** to reach fixed-cost breakeven (projected ~M14–16) with margin for hiring a second engineer and a small paid-acquisition budget.
- **Sensitivity:**
  - If conversion is **5%** not 8%: end MRR ~$7k, raise should lean to $300k for safety.
  - If COGS optimization stalls (GM stuck ~55%): burn rises ~$25–30k over the year — still inside a $250k raise but breakeven slips to ~M18.
  - If we hit **12% conversion** + strong NRR from Pro upsells: end MRR ~$16k, breakeven by ~M11, and the raise becomes optional.

## 5. The three numbers to watch

1. **Gross margin** — the entire model hinges on driving COGS/account from ~$59 (naive) to ~$7.50 via bundle sizing + model routing + caching. If this fails, the business is structurally unprofitable. **This is the #1 risk.**
2. **Free → paid conversion** — 8% is the base case; every point moves end-MRR by ~$1.3k.
3. **Churn** — at 6% monthly we lose ~half a cohort within a year; getting to 4% (north-star: weekly automated tasks) is what makes CAC pay back.
