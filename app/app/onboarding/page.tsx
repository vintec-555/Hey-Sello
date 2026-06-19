"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

type Conn = {
  email?: string;
  gmail?: { configured: boolean; connected: boolean };
};

export default function OnboardingPage() {
  const [conn, setConn] = useState<Conn>({});
  const [hasBrain, setHasBrain] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [c, b] = await Promise.all([
        fetch("/api/connections").then((r) => r.json()),
        fetch("/api/business").then((r) => r.json()),
      ]);
      setConn(c ?? {});
      const p = (b?.profile ?? {}) as Record<string, string>;
      setHasBrain(Boolean(p.name && (p.about || p.services)));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // Re-check when the user comes back from the Google connect flow.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const gmailDone = Boolean(conn.gmail?.connected);
  const gmailOff = conn.gmail && !conn.gmail.configured;
  const allDone = gmailDone && hasBrain;

  const steps = [
    {
      done: gmailDone,
      title: "Connect your inbox",
      body: "Let Sello read and reply to customer emails for you. This is the heart of the assistant.",
      action: gmailDone ? (
        <span className="ob-done">Connected ✓</span>
      ) : gmailOff ? (
        <span className="ob-note">Gmail isn’t configured on this deployment yet.</span>
      ) : (
        <a href="/api/connect/google" className="btn-approve">Connect Gmail</a>
      ),
    },
    {
      done: hasBrain,
      title: "Teach Sello about your business",
      body: "Add your services, prices, hours and FAQs so every reply is accurate and on-brand — not generic AI.",
      action: hasBrain ? (
        <span className="ob-done">Saved ✓ <Link href="/app/business" className="nav__link">Edit</Link></span>
      ) : (
        <Link href="/app/business" className="btn-approve">Set up Business Brain</Link>
      ),
    },
    {
      done: false,
      title: "Run your first task",
      body: "Tell Sello what to do in plain English — like “draft replies to today’s new customer emails.”",
      action: <Link href="/app" className="btn-approve">Open the console</Link>,
    },
  ];

  const completed = steps.filter((s) => s.done).length;

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/app" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <Link href="/app" className="nav__link">Skip for now →</Link>
      </header>

      <div className="ob">
        <h1 className="ob-title">Welcome to Hey Sello{conn.email ? `, ${conn.email}` : ""} 👋</h1>
        <p className="ob-sub">Three quick steps and your AI assistant is ready to work.</p>

        <div className="ob-progress">
          <div className="ob-progress__bar" style={{ width: `${(completed / 3) * 100}%` }} />
        </div>

        {loading ? (
          <p className="ob-sub">Loading…</p>
        ) : (
          <ol className="ob-steps">
            {steps.map((s, i) => (
              <li key={i} className={`ob-step${s.done ? " ob-step--done" : ""}`}>
                <div className="ob-step__num">{s.done ? "✓" : i + 1}</div>
                <div className="ob-step__main">
                  <h3 className="ob-step__title">{s.title}</h3>
                  <p className="ob-step__body">{s.body}</p>
                  <div className="ob-step__action">{s.action}</div>
                </div>
              </li>
            ))}
          </ol>
        )}

        {allDone && (
          <div className="ob-finish">
            <Link href="/app" className="waitlist__btn">You’re all set — start using Sello →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
