"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

type Profile = Record<string, string>;

const FIELDS: { key: string; label: string; hint: string; long?: boolean }[] = [
  { key: "name", label: "Business name", hint: "e.g. Brightloop Studio" },
  { key: "about", label: "What you do", hint: "One or two lines about your business" },
  { key: "services", label: "Services & prices", hint: "List your services and prices — Sello quotes these accurately", long: true },
  { key: "hours", label: "Hours", hint: "e.g. Mon–Sat, 9am–7pm" },
  { key: "location", label: "Location / area served", hint: "e.g. Hyderabad, or “we deliver pan-India”" },
  { key: "bookingLink", label: "Booking link", hint: "Sello shares this when a customer wants to book" },
  { key: "faqs", label: "Common questions & answers", hint: "Q: …  A: …  — Sello uses these to answer correctly", long: true },
  { key: "notes", label: "Anything else", hint: "Policies, things to always mention, things to avoid", long: true },
];

const TONES = ["Friendly & warm", "Professional", "Casual & chatty", "Formal"];

export default function BusinessBrainPage() {
  const [p, setP] = useState<Profile>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/business").then((r) => r.json()).then((d) => setP(d.profile ?? {})).catch(() => {});
  }, []);

  function set(k: string, v: string) {
    setP((s) => ({ ...s, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/app" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <Link href="/app" className="nav__link">← Back to Sello</Link>
      </header>

      <div className="brain">
        <h1 className="brain__title">🧠 Business Brain</h1>
        <p className="brain__sub">
          Tell Sello about your business once. It uses this in every reply and auto-draft, so customers get accurate,
          on-brand answers — not generic AI replies.
        </p>

        <label className="brain__field">
          <span className="brain__label">Tone of voice</span>
          <select className="voice-select" value={p.tone ?? TONES[0]} onChange={(e) => set("tone", e.target.value)}>
            {TONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {FIELDS.map((f) => (
          <label className="brain__field" key={f.key}>
            <span className="brain__label">{f.label}</span>
            {f.long ? (
              <textarea className="brain__input brain__input--area" rows={3} placeholder={f.hint} value={p[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            ) : (
              <input className="brain__input" placeholder={f.hint} value={p[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
            )}
            <span className="brain__hint">{f.hint}</span>
          </label>
        ))}

        <div className="brain__actions">
          <button className="btn-approve" onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Business Brain"}
          </button>
          {saved && <span className="brain__saved">Sello will now use this in every reply.</span>}
        </div>
      </div>
    </div>
  );
}
