"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

export default function ResetPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Read the token from the URL on mount (avoids useSearchParams Suspense rules).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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
        <Link href="/" className="brand" style={{ justifyContent: "center", marginBottom: 18 }}><Logo /></Link>
        <h1 className="auth-title">Choose a new password</h1>
        {!token ? (
          <p className="auth-sub">This reset link is missing its token. Request a new one from the <Link href="/forgot">forgot password</Link> page.</p>
        ) : (
          <>
            <p className="auth-sub">Enter a new password for your account.</p>
            <form onSubmit={submit} className="auth-form">
              <label className="auth-field">
                <span>New password</span>
                <input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button type="submit" className="waitlist__btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Saving…" : "Set new password"}
              </button>
            </form>
          </>
        )}
        <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
      </div>
    </div>
  );
}
