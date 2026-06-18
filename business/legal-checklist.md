# Hey Sello — Launch Legal & Compliance Checklist

> **This is an operational checklist, not legal advice.** Hey Sello connects to people's email and business data, so getting this right is a trust requirement, not a formality. Engage a qualified lawyer (India + at least one Western jurisdiction) before launch and before collecting PII at scale.

## 1. Entity setup

Decide the corporate structure early — it's painful to change later.

- [ ] **Pick the entity.** Trade-offs:
  - **India Private Limited (Pvt Ltd):** simplest if founders/customers/banking are India-first; lower setup cost; FEMA/RBI rules complicate taking USD from foreign VCs and US customers paying you.
  - **Delaware C-corp (with India subsidiary):** standard if you want global SaaS revenue and Western VC money; "flip" structure (Delaware parent, Indian wholly-owned subsidiary for ops/dev). Most India SaaS startups targeting global SMB do this. More expensive, more compliance, but investor-ready.
  - **Recommendation given target market (India + global SMB, likely raising):** lean **Delaware C-corp + Indian subsidiary**, or start Pvt Ltd and plan the flip — but do the flip *before* the cap table gets complex.
- [ ] Reserve company name; register the entity; get incorporation docs.
- [ ] Founder agreements + **vesting** (4-year, 1-year cliff) signed before any equity talk.
- [ ] IP assignment: every founder/contractor/employee assigns IP to the company in writing.
- [ ] Bank account(s); India: GST registration if turnover/threshold requires; US: EIN.
- [ ] Register the trademark for "Hey Sello" in primary markets; secure heysello.in + defensive domains.

## 2. Terms of Service & Privacy Policy

Don't ship the landing page's "Join waitlist" button without at least a privacy notice.

- [ ] **Terms of Service** covering: acceptable use, the fact that an **AI agent acts on the user's behalf** (and the user is responsible for authorizing it), no warranty on agent outputs, liability cap, suspension/termination, governing law.
- [ ] **Privacy Policy** covering: what data we collect (account info, connected-tool data, email content the agent reads), why, how long we keep it, who we share it with (subprocessors — incl. **Anthropic/Claude as an LLM subprocessor**), and user rights.
- [ ] **Subprocessor list** published (Anthropic, hosting provider, payment processor, analytics) and a process to notify users of changes.
- [ ] **DPA (Data Processing Agreement)** template ready for business customers who ask — Team/Enterprise will.
- [ ] **AI-specific disclosures:** state clearly that an LLM processes their content, that the agent can make mistakes, and that destructive/irreversible actions are gated by approval.
- [ ] Cookie/consent banner if using analytics that set cookies (esp. for EU visitors).

## 3. Data protection (DPDP Act + GDPR basics)

We touch personal data the moment a user connects Gmail. Two regimes matter at launch:

**India — Digital Personal Data Protection (DPDP) Act, 2023**
- [ ] Identify as **Data Fiduciary**; users are **Data Principals**.
- [ ] **Consent** must be free, specific, informed, and unambiguous — get explicit consent before connecting any tool/reading any data.
- [ ] Provide a **consent notice** in plain language (and support Indian-language notices where feasible).
- [ ] Honor Data Principal rights: access, correction, erasure, grievance redressal.
- [ ] Appoint a **grievance officer** / point of contact; publish it.
- [ ] Children's data: don't process data of under-18s without verifiable parental consent (relevant if any user is a minor — restrict in ToS).

**EU/UK — GDPR / UK GDPR (any EU/UK customer triggers this)**
- [ ] Establish **lawful basis** (consent or legitimate interest) per processing purpose.
- [ ] Honor data-subject rights (access, deletion, portability, objection).
- [ ] **Data minimization & purpose limitation** — only read/store what the automation needs.
- [ ] Map **international data transfers** (India ↔ EU ↔ US, plus Anthropic's processing region) and use SCCs / appropriate safeguards.
- [ ] Be ready to sign DPAs as a **processor** for business customers.
- [ ] If/when scale warrants, consider whether a **DPO** is required.

**Both**
- [ ] **Data retention policy** written and enforced — default to short retention of email/PII content; don't hoard.
- [ ] **Breach notification** runbook (who, what timeline, which regulator).

## 4. OAuth scopes & data handling (least privilege)

This is where an email-touching AI tool earns or loses trust. Get it right technically *and* document it.

- [ ] **Request the narrowest OAuth scopes** that make each automation work — e.g. prefer `gmail.modify`/specific scopes over full-mailbox; don't ask for write/send scopes until an automation needs them.
- [ ] **Incremental authorization** — request a scope only when the user enables the automation that needs it, not all upfront.
- [ ] Complete **Google's OAuth verification / security assessment** for restricted Gmail scopes *before* scaling (this can take weeks — start early). Same for any Slack/Microsoft app review.
- [ ] **Encrypt OAuth tokens at rest**, store in a dedicated secrets store, never in logs.
- [ ] **Never put credentials in LLM prompts.** Tokens stay server-side; the agent calls tools, the harness injects auth. (Matches the vault/least-privilege pattern for agent tooling.)
- [ ] Let users **revoke** a connection and **delete** associated data from one screen.
- [ ] Gate **irreversible actions** (send email, delete, external API writes) behind explicit user approval, especially early — reversibility is a security and trust lever.
- [ ] **Don't train on customer data** by default; if Anthropic's terms / your config matter here, confirm and state it in the Privacy Policy. Prefer zero-data-retention or short-retention options where available and compatible with the models you use.

## 5. Security basics (pre-launch minimum)

- [ ] TLS everywhere; encryption at rest for the database and token store.
- [ ] Role-based access internally; principle of least privilege for staff; no shared admin creds.
- [ ] Audit logging of agent actions (the customer-facing audit log is also a Team-tier feature).
- [ ] Secrets management (no secrets in code/repos); secret scanning in CI.
- [ ] Dependency and vulnerability scanning; a basic incident-response plan.
- [ ] Backups + tested restore.
- [ ] Rate limiting / abuse prevention on the agent (don't let a bad prompt fire 10,000 emails).
- [ ] Plan for **SOC 2 Type I** once you chase larger/Team+Enterprise customers (not required day 1, but Team buyers will ask — start the evidence trail early).

## 6. Before collecting emails / PII at scale — gate checklist

Do **not** flip from "private beta with 10 friendly users" to "open signups" until:

- [ ] Privacy Policy + ToS are live and linked from the signup flow.
- [ ] Consent is captured and logged before any tool connection.
- [ ] OAuth apps are verified (or you're operating within unverified-app user caps).
- [ ] Tokens are encrypted; deletion/revocation works end-to-end and is tested.
- [ ] Retention policy is enforced in code, not just written down.
- [ ] Subprocessor list (incl. Anthropic) is published.
- [ ] Grievance/contact channel is live (DPDP requirement).
- [ ] A lawyer has reviewed ToS, Privacy Policy, and the data-transfer setup.

---

*Reminder: this checklist is for planning and is not legal advice. Validate everything with qualified counsel in each market you operate in before launch.*
