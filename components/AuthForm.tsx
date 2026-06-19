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
      window.location.href = "/app";
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

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={signup ? "At least 6 characters" : "Your password"} />
          </label>
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
