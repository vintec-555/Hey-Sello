"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
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
  | { kind: "error"; text: string };

type Connections = {
  agent: boolean;
  gmail: { configured: boolean; connected: boolean };
  whatsapp: { configured: boolean; connected: boolean };
  voice?: { premium: boolean };
};

const APP_ICON: Record<string, string> = { gmail: "📧", whatsapp: "💬", crm: "📇", app: "⟳" };
const PRETTY: Record<string, string> = {
  gmail_search: "Searched Gmail",
  gmail_send_reply: "Sent an email",
  whatsapp_recent: "Read WhatsApp",
  whatsapp_send: "Sent a WhatsApp message",
  crm_upsert_contact: "Updated the CRM",
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

  async function run(text: string, demo = false) {
    if (!text.trim() || running) return;
    setSteps([]);
    setLive(null);
    setRunning(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text, demo }),
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
          if (s.kind === "message")
            return (
              <div className="step-row step-row--msg" key={i}>
                <span className="step-ico">⟳</span>
                <div className="step-body">{s.text}</div>
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
  if (input.query) return `“${input.query}”`;
  if (input.email) return `${input.email}${input.stage ? ` → ${input.stage}` : ""}`;
  if (input.text) return truncate(String(input.text));
  return truncate(JSON.stringify(input));
}

function truncate(s: string, n = 64) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
