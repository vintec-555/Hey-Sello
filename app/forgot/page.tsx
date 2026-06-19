"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="brand" style={{ justifyContent: "center", marginBottom: 18 }}><Logo /></Link>
        <h1 className="auth-title">Reset your password</h1>
        {sent ? (
          <p className="auth-sub">If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.</p>
        ) : (
          <>
            <p className="auth-sub">Enter your email and we&apos;ll send you a reset link.</p>
            <form onSubmit={submit} className="auth-form">
              <label className="auth-field">
                <span>Email</span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </label>
              <button type="submit" className="waitlist__btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}
        <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
