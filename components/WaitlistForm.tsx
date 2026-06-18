"use client";

import { useState } from "react";

export default function WaitlistForm({
  dark = false,
  cta = "Get early access",
  note = "No spam. Just an invite when your spot opens up.",
}: {
  dark?: boolean;
  cta?: string;
  note?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ text: string; kind?: "success" | "error" }>({ text: note });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setEmail("");
      setDone(true);
      setStatus({ text: "🎉 You're on the list! We'll be in touch.", kind: "success" });
    } catch (err) {
      setStatus({ text: "😕 " + (err instanceof Error ? err.message : "Try again."), kind: "error" });
      setBusy(false);
    }
  }

  return (
    <>
      <form className={`waitlist${dark ? " waitlist--dark" : ""}`} onSubmit={submit} aria-label="Join the waitlist">
        <input
          type="email"
          name="email"
          className="waitlist__input"
          placeholder="you@company.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={done}
        />
        <button type="submit" className="waitlist__btn" disabled={busy || done}>
          {done ? "You're in!" : busy ? "Joining…" : cta}
        </button>
      </form>
      <p className={`waitlist__note${status.kind ? " is-" + status.kind : ""}`}>{status.text}</p>
    </>
  );
}
