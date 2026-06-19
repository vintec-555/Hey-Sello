"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

type Billing = { plan: "free" | "pro"; status?: string };

const PRO_FEATURES = [
  "Unlimited AI replies & auto-drafts",
  "Automatic triggers — Sello works 24/7",
  "Connect Gmail + WhatsApp",
  "Business Brain for accurate, on-brand replies",
  "Premium voice assistant",
  "Priority support",
];

export default function BillingPage() {
  const [billing, setBilling] = useState<Billing>({ plan: "free" });
  const [configured, setConfigured] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/billing")
      .then((r) => r.json())
      .then((d) => {
        if (d.billing) setBilling(d.billing);
        setConfigured(d.configured ?? false);
      })
      .catch(() => {});
  }, []);

  async function upgrade() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again.");
      setBusy(false);
    }
  }

  const isPro = billing.plan === "pro";

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/app" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <Link href="/app" className="nav__link">← Back to Sello</Link>
      </header>

      <div className="bill">
        <h1 className="bill-title">Plans & billing</h1>
        <p className="bill-sub">
          You’re on the <strong>{isPro ? "Pro" : "Free"}</strong> plan{billing.status ? ` (${billing.status})` : ""}.
        </p>

        <div className="bill-grid">
          <div className={`bill-card${!isPro ? " bill-card--current" : ""}`}>
            <h3 className="bill-card__name">Free</h3>
            <div className="bill-card__price">₹0<span>/mo</span></div>
            <ul className="bill-card__list">
              <li>Try Sello with your inbox</li>
              <li>Manual replies & drafts</li>
              <li>Business Brain setup</li>
            </ul>
            {!isPro && <div className="bill-card__tag">Current plan</div>}
          </div>

          <div className={`bill-card bill-card--pro${isPro ? " bill-card--current" : ""}`}>
            <h3 className="bill-card__name">Pro</h3>
            <div className="bill-card__price">₹1,499<span>/mo</span></div>
            <ul className="bill-card__list">
              {PRO_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            {isPro ? (
              <div className="bill-card__tag">Current plan ✓</div>
            ) : (
              <button className="waitlist__btn" onClick={upgrade} disabled={busy} style={{ width: "100%" }}>
                {busy ? "Starting…" : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}
        {!configured && (
          <p className="bill-note">Billing isn’t configured on this deployment yet. Add your Stripe keys to enable upgrades.</p>
        )}
      </div>
    </div>
  );
}
