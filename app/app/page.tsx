"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Step =
  | { kind: "status"; text: string }
  | { kind: "tool"; app: string; name: string; input: Record<string, unknown> }
  | { kind: "result"; text: string }
  | { kind: "message"; text: string }
  | { kind: "error"; text: string };

const APP_ICON: Record<string, string> = { gmail: "📧", slack: "💬", notion: "📝", crm: "📇", app: "⟳" };
const PRETTY: Record<string, string> = {
  gmail_search: "Searched Gmail",
  gmail_send_reply: "Sent a reply",
  crm_upsert_contact: "Updated the CRM",
  slack_post_message: "Posted to Slack",
  notion_add_row: "Added a Notion row",
};

const SUGGESTIONS = [
  "Reply to new leads and log them in the CRM",
  "Find demo requests in my inbox and notify #sales",
  "Triage my unread email and summarize what needs a reply",
];

export default function AppPage() {
  const [task, setTask] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<boolean | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  function push(s: Step) {
    setSteps((prev) => [...prev, s]);
    requestAnimationFrame(() => feedRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }

  async function run(text: string) {
    if (!text.trim() || running) return;
    setSteps([]);
    setLive(null);
    setRunning(true);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: text }),
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
          const payload = JSON.parse(data);
          if (ev === "mode") setLive(payload.live);
          else if (ev === "status") push({ kind: "status", text: payload.text });
          else if (ev === "tool") push({ kind: "tool", app: payload.app, name: payload.name, input: payload.input });
          else if (ev === "result") push({ kind: "result", text: payload.summary });
          else if (ev === "message") push({ kind: "message", text: payload.text });
          else if (ev === "error") push({ kind: "error", text: payload.message });
        }
      }
    } catch (err) {
      push({ kind: "error", text: err instanceof Error ? err.message : "Run failed." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="brand__mark">⟳</span> Hey Sello
        </Link>
        {live !== null && (
          <span className={`app-badge ${live ? "app-badge--live" : "app-badge--demo"}`}>
            {live ? "Live agent" : "Demo mode"}
          </span>
        )}
      </header>

      <p className="app-hint">
        Tell Sello what to do across your connected apps. It plans, then runs each step for you.
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
          if (s.kind === "tool") {
            return (
              <div className="step-row" key={i}>
                <span className="step-ico">{APP_ICON[s.app] ?? "⟳"}</span>
                <div className="step-body">
                  <div className="tname">{PRETTY[s.name] ?? s.name}</div>
                  <div className="targ">{summarizeInput(s.input)}</div>
                </div>
              </div>
            );
          }
          if (s.kind === "result") {
            return (
              <div className="step-row step-row--result" key={i}>
                <span className="step-ico">✓</span>
                <div className="step-body targ">{s.text}</div>
              </div>
            );
          }
          if (s.kind === "message") {
            return (
              <div className="step-row step-row--msg" key={i}>
                <span className="step-ico">⟳</span>
                <div className="step-body">{s.text}</div>
              </div>
            );
          }
          if (s.kind === "error") {
            return (
              <div className="step-row step-row--error" key={i}>
                <span className="step-ico">!</span>
                <div className="step-body">{s.text}</div>
              </div>
            );
          }
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
          <button type="submit" disabled={running || !task.trim()}>Run</button>
        </form>
        <p className="app-foot">
          Runs on connected-app fixtures so you can explore safely. <Link href="/">← Back to site</Link>
        </p>
      </div>
    </div>
  );
}

function summarizeInput(input: Record<string, unknown>): string {
  if (!input) return "";
  if (input.to) return `to ${input.to}`;
  if (input.query) return `“${input.query}”`;
  if (input.channel) return `${input.channel}: ${truncate(String(input.text ?? ""))}`;
  if (input.email) return `${input.email}${input.stage ? ` → ${input.stage}` : ""}`;
  if (input.title) return String(input.title);
  return truncate(JSON.stringify(input));
}

function truncate(s: string, n = 64) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
