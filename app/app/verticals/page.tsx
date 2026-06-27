"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";

type ItemStatus = "active" | "pending" | "attention";

type VerticalSummary = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  status: ItemStatus;
  counts: { active: number; pending: number; attention: number; total: number };
  attentionItems: string[];
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  active: "Active",
  pending: "Pending",
  attention: "Needs attention",
};

export default function VerticalsPage() {
  const [verticals, setVerticals] = useState<VerticalSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/verticals")
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setVerticals(d.verticals ?? [])))
      .catch(() => setError("Couldn’t load your verticals."));
  }, []);

  const totals = (verticals ?? []).reduce(
    (acc, v) => ({
      active: acc.active + v.counts.active,
      pending: acc.pending + v.counts.pending,
      attention: acc.attention + v.counts.attention,
    }),
    { active: 0, pending: 0, attention: 0 },
  );

  // Show the ones that need attention first.
  const ordered = [...(verticals ?? [])].sort((a, b) => {
    const rank: Record<ItemStatus, number> = { attention: 0, pending: 1, active: 2 };
    return rank[a.status] - rank[b.status];
  });

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/app" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <Link href="/app" className="nav__link">← Back to Sello</Link>
      </header>

      <div className="vert">
        <h1 className="vert__title">📊 Business verticals</h1>
        <p className="vert__sub">
          Every line of your business in one place — what’s active, what’s pending, and what needs your attention.
          Open any vertical for its full board.
        </p>

        <div className="vert-totals">
          <div className="vert-stat vert-stat--attention">
            <span className="vert-stat__num">{totals.attention}</span>
            <span className="vert-stat__label">Need attention</span>
          </div>
          <div className="vert-stat vert-stat--pending">
            <span className="vert-stat__num">{totals.pending}</span>
            <span className="vert-stat__label">Pending</span>
          </div>
          <div className="vert-stat vert-stat--active">
            <span className="vert-stat__num">{totals.active}</span>
            <span className="vert-stat__label">Active</span>
          </div>
        </div>

        {error && <p className="vert-empty">{error}</p>}
        {!verticals && !error && <p className="vert-empty">Loading your verticals…</p>}
        {verticals && verticals.length === 0 && <p className="vert-empty">No verticals yet.</p>}

        <div className="vert-grid">
          {ordered.map((v) => (
            <Link key={v.id} href={`/app/verticals/${v.id}`} className={`vert-card vert-card--${v.status}`}>
              <div className="vert-card__head">
                <span className="vert-card__emoji">{v.emoji}</span>
                <span className={`vert-pill vert-pill--${v.status}`}>{STATUS_LABEL[v.status]}</span>
              </div>
              <h2 className="vert-card__name">{v.name}</h2>
              {v.description && <p className="vert-card__desc">{v.description}</p>}

              <div className="vert-card__counts">
                <span className="vert-count vert-count--active">{v.counts.active} active</span>
                <span className="vert-count vert-count--pending">{v.counts.pending} pending</span>
                <span className="vert-count vert-count--attention">{v.counts.attention} attention</span>
              </div>

              {v.attentionItems.length > 0 && (
                <ul className="vert-card__flags">
                  {v.attentionItems.slice(0, 2).map((t) => (
                    <li key={t}>⚠ {t}</li>
                  ))}
                  {v.attentionItems.length > 2 && <li>+{v.attentionItems.length - 2} more</li>}
                </ul>
              )}

              <span className="vert-card__open">Open board →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
