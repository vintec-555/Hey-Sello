"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      // New accounts go through onboarding; returning users go straight in.
      window.location.href = signup ? "/app/onboarding" : "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <Link href="/" className="brand" style={{ justifyContent: "center", marginBottom: 18 }}>
          <Logo />
        </Link>
        <h1 className="auth-title">{signup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">{signup ? "Start automating your busywork in minutes." : "Sign in to your Hey Sello."}</p>

        <a href="/api/auth/google" className="auth-google">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </a>

        <div className="auth-or"><span>or</span></div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? "At least 6 characters" : "Your password"} />
          </label>
          {!signup && (
            <p className="auth-forgot"><Link href="/forgot">Forgot password?</Link></p>
          )}
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="waitlist__btn" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {signup ? (
            <>Already have an account? <Link href="/login">Sign in</Link></>
          ) : (
            <>New to Hey Sello? <Link href="/signup">Create an account</Link></>
          )}
        </p>
      </div>
    </div>
  );
}
