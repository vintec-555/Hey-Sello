"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import VoicePicker, { DEFAULT_VOICE_ID } from "@/components/VoicePicker";
import RichText from "@/components/RichText";
import { useVoice, type VoiceStatus } from "@/lib/useVoice";

const VOICE_LABEL: Record<VoiceStatus, string> = {
  off: "",
  wake: "🎙️ Listening for “Hey Sello”…",
  listening: "🎙️ Listening — what should I do?",
  thinking: "💭 Working on it…",
  speaking: "🔊 Speaking…",
};

type Step =
  | { kind: "status"; text: string }
  | { kind: "tool"; app: string; name: string; input: Record<string, unknown> }
  | { kind: "result"; text: string; ok?: boolean }
  | { kind: "message"; text: string }
  | { kind: "error"; text: string }
  | { kind: "draft"; id: string; app: string; to: string; subject?: string; body: string };

type DraftState = "pending" | "sending" | "sent" | "error" | "discarded";
type Pending = { id: string; from: string; fromEmail: string; subject: string; replySubject: string; replyBody: string };

type Connections = {
  agent: boolean;
  gmail: { configured: boolean; connected: boolean };
  whatsapp: { configured: boolean; connected: boolean };
  voice?: { premium: boolean };
};

const APP_ICON: Record<string, string> = { gmail: "📧", whatsapp: "💬", crm: "📇", app: "⟳" };
const PRETTY: Record<string, string> = {
  gmail_search: "Reading your inbox",
  gmail_send_reply: "Sending an email",
  whatsapp_recent: "Reading WhatsApp",
  whatsapp_send: "Sending a WhatsApp message",
  crm_upsert_contact: "Saving to your CRM",
};

const SUGGESTIONS = [
  "Find demo requests in my inbox and reply, then log them in the CRM",
  "Read my recent WhatsApp messages and summarize what needs a reply",
  "Reply to unread leads from the last 2 days",
];

export default function AppPage() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const [conn, setConn] = useState<Connections | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const runRef = useRef<(t: string) => void>(() => {});
  const voice = useVoice((t) => { setTask(t); runRef.current(t); });
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [review, setReview] = useState(true);
  const [draftStatus, setDraftStatus] = useState<Record<string, DraftState>>({});

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sello.review");
    if (saved === "off") setReview(false);
  }, []);

  function chooseReview(v: boolean) {
    setReview(v);
    try { localStorage.setItem("sello.review", v ? "on" : "off"); } catch {}
  }

  async function approveDraft(d: { id: string; app: string; to: string; subject?: string; body: string }) {
    setDraftStatus((s) => ({ ...s, [d.id]: "sending" }));
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app: d.app, to: d.to, subject: d.subject, body: d.body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setDraftStatus((s) => ({ ...s, [d.id]: "sent" }));
    } catch {
      setDraftStatus((s) => ({ ...s, [d.id]: "error" }));
    }
  }

  useEffect(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("sello.voice");
    const id = saved || DEFAULT_VOICE_ID;
    setVoiceId(id);
    voice.setVoiceId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseVoice(id: string) {
    setVoiceId(id);
    voice.setVoiceId(id);
    try { localStorage.setItem("sello.voice", id); } catch {}
  }

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => { setConn(d); voice.setPremium(Boolean(d?.voice?.premium)); })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function push(s: Step) {
    setSteps((prev) => [...prev, s]);
    requestAnimationFrame(() => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }

  const [pending, setPending] = useState<Pending[]>([]);
  const [pendingStatus, setPendingStatus] = useState<Record<string, "sending" | "sent" | "discarded" | "error">>({});

  useEffect(() => {
    fetch("/api/drafts").then((r) => r.json()).then((d) => setPending(d.drafts ?? [])).catch(() => {});
  }, []);

  async function resolvePending(p: Pending, action: "approve" | "discard") {
    setPendingStatus((s) => ({ ...s, [p.id]: action === "approve" ? "sending" : "discarded" }));
    try {
      const r = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, action }),
      });
      if (action === "approve") {
        if (!r.ok) throw new Error();
        setPendingStatus((s) => ({ ...s, [p.id]: "sent" }));
      }
    } catch {
      setPendingStatus((s) => ({ ...s, [p.id]: "error" }));
    }
  }

  async function run(text: string, demo = false) {
    if (!text.trim() || running) return;
    setSteps([]);
    setDraftStatus({});
    setLive(null);
    setRunning(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text, demo, review }),
      });
      if (!res.body) throw new Error("No response stream.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const ev = /event: (.*)/.exec(chunk)?.[1];
          const data = /data: (.*)/.exec(chunk)?.[1];
          if (!ev || !data) continue;
          const p = JSON.parse(data);
          if (ev === "mode") setLive(p.live);
          else if (ev === "status") push({ kind: "status", text: p.text });
          else if (ev === "tool") push({ kind: "tool", app: p.app, name: p.name, input: p.input });
          else if (ev === "result") push({ kind: "result", text: p.summary, ok: p.ok });
          else if (ev === "message") { push({ kind: "message", text: p.text }); if (voice.on) voice.speak(p.text); }
          else if (ev === "draft") { push({ kind: "draft", id: p.id, app: p.app, to: p.to, subject: p.subject, body: p.body }); setDraftStatus((s) => ({ ...s, [p.id]: "pending" })); }
          else if (ev === "error") push({ kind: "error", text: p.message });
        }
      }
    } catch (err) {
      push({ kind: "error", text: err instanceof Error ? err.message : "Run failed." });
    } finally {
      setRunning(false);
      voice.resume();
    }
  }
  runRef.current = run;

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <div className="app-head__right">
          <Link href="/app/business" className="nav__link" style={{ fontSize: "0.85rem" }}>🧠 Business Brain</Link>
          {voice.supported && (
            <button
              className={`voice-btn${voice.on ? " voice-btn--on" : ""}`}
              onClick={() => (voice.on ? voice.disable() : voice.enable())}
              title={voice.on ? "Turn voice off" : "Talk to Sello — say “Hey Sello”"}
            >
              🎙️ {voice.on ? "Voice on" : "Voice"}
            </button>
          )}
          {live !== null && (
            <span className={`app-badge ${live ? "app-badge--live" : "app-badge--demo"}`}>
              {live ? "Live · real actions" : "Simulated"}
            </span>
          )}
        </div>
      </header>

      {voice.on && voice.status !== "off" && (
        <div className="voice-status">
          <span className="voice-pulse" />
          {VOICE_LABEL[voice.status]}
        </div>
      )}

      {pending.length > 0 && (
        <div className="pending-panel">
          <div className="pending-panel__head">
            <span className="pending-panel__title">
              ✨ Sello handled {pending.length} message{pending.length > 1 ? "s" : ""} while you were away
            </span>
            <span className="pending-panel__sub">Review the replies it drafted — nothing sends until you approve.</span>
          </div>
          {pending.map((p) => {
            const st = pendingStatus[p.id];
            if (st === "discarded") return null;
            return (
              <div className="draft-card" key={p.id}>
                <div className="draft-card__head">
                  <span className="draft-card__app">Email draft</span>
                  <span className="draft-card__to">to {p.fromEmail}</span>
                </div>
                <div className="draft-card__subj">{p.replySubject}</div>
                <div className="draft-card__body">{p.replyBody}</div>
                {!st && (
                  <div className="draft-card__actions">
                    <button className="btn-approve" onClick={() => resolvePending(p, "approve")}>Approve &amp; send</button>
                    <button className="btn-discard" onClick={() => resolvePending(p, "discard")}>Discard</button>
                  </div>
                )}
                {st === "sending" && <div className="draft-card__status"><span className="spinner" /> Sending…</div>}
                {st === "sent" && <div className="draft-card__status is-sent">✓ Sent</div>}
                {st === "error" && (
                  <div className="draft-card__actions">
                    <span className="draft-card__status is-err">Couldn’t send.</span>
                    <button className="btn-approve" onClick={() => resolvePending(p, "approve")}>Retry</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {conn && (
        <div className="conn-bar">
          <ConnChip
            label="Gmail"
            icon="📧"
            ok={conn.gmail.connected}
            action={
              conn.gmail.connected
                ? undefined
                : conn.gmail.configured
                ? { href: "/api/connect/google", text: "Connect" }
                : { hint: "Set GOOGLE_CLIENT_ID" }
            }
          />
          <ConnChip
            label="WhatsApp"
            icon="💬"
            ok={conn.whatsapp.connected}
            action={conn.whatsapp.connected ? undefined : { hint: "Set WHATSAPP_TOKEN" }}
          />
          <ConnChip label="Agent" icon="🧠" ok={conn.agent} action={conn.agent ? undefined : { hint: "Set ANTHROPIC_API_KEY" }} />
        </div>
      )}

      {voice.supported && (
        <VoicePicker
          value={voiceId}
          premium={Boolean(conn?.voice?.premium)}
          onChange={chooseVoice}
          onPreview={() => voice.preview()}
        />
      )}

      <p className="app-hint">
        Tell Sello what to do across your connected apps. It plans, then runs each step — for real.
      </p>

      {steps.length === 0 && (
        <div className="suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setTask(s); run(s); }} disabled={running}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="feed">
        {steps.map((s, i) => {
          if (s.kind === "tool")
            return (
              <div className="step-row" key={i}>
                <span className="step-ico">{APP_ICON[s.app] ?? "⟳"}</span>
                <div className="step-body">
                  <div className="tname">{PRETTY[s.name] ?? s.name}</div>
                  <div className="targ">{summarizeInput(s.input)}</div>
                </div>
              </div>
            );
          if (s.kind === "result")
            return (
              <div className={`step-row step-row--result${s.ok === false ? " step-row--error" : ""}`} key={i}>
                <span className="step-ico">{s.ok === false ? "!" : "✓"}</span>
                <div className="step-body targ">{s.text}</div>
              </div>
            );
          if (s.kind === "draft") {
            const st = draftStatus[s.id] ?? "pending";
            return (
              <div className="step-row" key={i}>
                <span className="step-ico">✉️</span>
                <div className="draft-card">
                  <div className="draft-card__head">
                    <span className="draft-card__app">{s.app === "whatsapp" ? "WhatsApp draft" : "Email draft"}</span>
                    <span className="draft-card__to">to {s.to}</span>
                  </div>
                  {s.subject && <div className="draft-card__subj">{s.subject}</div>}
                  <div className="draft-card__body">{s.body}</div>
                  {st === "pending" && (
                    <div className="draft-card__actions">
                      <button className="btn-approve" onClick={() => approveDraft(s)}>Approve &amp; send</button>
                      <button className="btn-discard" onClick={() => setDraftStatus((m) => ({ ...m, [s.id]: "discarded" }))}>Discard</button>
                    </div>
                  )}
                  {st === "sending" && <div className="draft-card__status"><span className="spinner" /> Sending…</div>}
                  {st === "sent" && <div className="draft-card__status is-sent">✓ Sent</div>}
                  {st === "discarded" && <div className="draft-card__status is-off">Discarded</div>}
                  {st === "error" && (
                    <div className="draft-card__actions">
                      <span className="draft-card__status is-err">Couldn’t send.</span>
                      <button className="btn-approve" onClick={() => approveDraft(s)}>Retry</button>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          if (s.kind === "message")
            return (
              <div className="step-row step-row--msg" key={i}>
                <span className="step-ico">✦</span>
                <div className="step-body"><RichText text={s.text} /></div>
              </div>
            );
          if (s.kind === "error")
            return (
              <div className="step-row step-row--error" key={i}>
                <span className="step-ico">!</span>
                <div className="step-body">{s.text}</div>
              </div>
            );
          return (
            <div className="step-row step-row--status" key={i}>
              <span className="step-ico"><span className="spinner" /></span>
              <div className="step-body">{s.text}</div>
            </div>
          );
        })}
        {running && (
          <div className="step-row step-row--status">
            <span className="step-ico"><span className="spinner" /></span>
            <div className="step-body">Working…</div>
          </div>
        )}
        <div ref={feedRef} />
      </div>

      <div className="composer">
        <label className="review-toggle" title="When on, Sello shows you each email/message to approve before it sends.">
          <input type="checkbox" checked={review} onChange={(e) => chooseReview(e.target.checked)} />
          <span className="review-toggle__track"><span className="review-toggle__thumb" /></span>
          <span className="review-toggle__label">
            🛡️ Review before send{review ? "" : " · off — sends immediately"}
          </span>
        </label>
        <form onSubmit={(e) => { e.preventDefault(); run(task); }}>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(task); } }}
            placeholder="Hey Sello, …"
            rows={1}
          />
          <button type="submit" disabled={running || !task.trim()}>Run for real</button>
        </form>
        <p className="app-foot">
          <button className="link-btn" onClick={() => run(task || SUGGESTIONS[0], true)} disabled={running}>
            ▶ Preview the flow (simulated — sends nothing)
          </button>
          {"  ·  "}
          <Link href="/">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}

function ConnChip({
  label,
  icon,
  ok,
  action,
}: {
  label: string;
  icon: string;
  ok: boolean;
  action?: { href?: string; text?: string; hint?: string };
}) {
  return (
    <span className={`conn-chip${ok ? " conn-chip--ok" : ""}`}>
      <span>{icon}</span>
      <strong>{label}</strong>
      {ok ? (
        <span className="conn-dot" aria-label="connected">connected</span>
      ) : action?.href ? (
        <a href={action.href}>{action.text}</a>
      ) : (
        <span className="conn-hint">{action?.hint}</span>
      )}
    </span>
  );
}

function summarizeInput(input: Record<string, unknown>): string {
  if (!input) return "";
  if (input.to) return `to ${input.to}`;
  if (input.query) {
    const q = String(input.query);
    return /[a-z_]+:/i.test(q) ? "looking through recent messages" : `for “${q}”`;
  }
  if (input.email) return `${input.email}${input.stage ? ` → ${input.stage}` : ""}`;
  if (input.text) return truncate(String(input.text));
  return truncate(JSON.stringify(input));
}

function truncate(s: string, n = 64) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
