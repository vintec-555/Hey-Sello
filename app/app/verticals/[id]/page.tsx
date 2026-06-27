"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import Logo from "@/components/Logo";

type ItemStatus = "active" | "pending" | "attention";

type BoardItem = {
  id: string;
  title: string;
  detail?: string;
  status: ItemStatus;
  owner?: string;
  due?: string;
  updatedAt: string;
};

type Vertical = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  items: BoardItem[];
};

const COLUMNS: { status: ItemStatus; label: string; hint: string }[] = [
  { status: "attention", label: "Needs attention", hint: "Blocked, overdue or at risk" },
  { status: "pending", label: "Pending", hint: "Queued or waiting" },
  { status: "active", label: "Active", hint: "Running / on track" },
];

export default function VerticalBoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<ItemStatus | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/verticals/${id}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setVertical(d.vertical)))
      .catch(() => setError("Couldn’t load this board."));
  }, [id]);

  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const r = await fetch(`/api/verticals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.vertical) setVertical(d.vertical);
    } finally {
      setBusy(false);
    }
  }

  async function addItem(status: ItemStatus) {
    if (!newTitle.trim()) return;
    await mutate({ action: "add", status, title: newTitle, detail: newDetail });
    setNewTitle("");
    setNewDetail("");
    setAdding(null);
  }

  const counts = {
    active: vertical?.items.filter((i) => i.status === "active").length ?? 0,
    pending: vertical?.items.filter((i) => i.status === "pending").length ?? 0,
    attention: vertical?.items.filter((i) => i.status === "attention").length ?? 0,
  };

  return (
    <div className="app-wrap">
      <header className="app-head">
        <Link href="/app" className="app-head__title" style={{ textDecoration: "none", color: "inherit" }}>
          <Logo />
        </Link>
        <Link href="/app/verticals" className="nav__link">← All verticals</Link>
      </header>

      {error && <p className="vert-empty">{error}</p>}
      {!vertical && !error && <p className="vert-empty">Loading board…</p>}

      {vertical && (
        <div className="vert">
          <div className="board-head">
            <div>
              <h1 className="vert__title">
                <span className="board-head__emoji">{vertical.emoji}</span> {vertical.name}
              </h1>
              {vertical.description && <p className="vert__sub">{vertical.description}</p>}
            </div>
            <div className="board-head__counts">
              <span className="vert-count vert-count--attention">{counts.attention} attention</span>
              <span className="vert-count vert-count--pending">{counts.pending} pending</span>
              <span className="vert-count vert-count--active">{counts.active} active</span>
            </div>
          </div>

          <div className="board">
            {COLUMNS.map((col) => {
              const items = vertical.items.filter((i) => i.status === col.status);
              return (
                <div className={`board-col board-col--${col.status}`} key={col.status}>
                  <div className="board-col__head">
                    <span className="board-col__title">{col.label}</span>
                    <span className="board-col__count">{items.length}</span>
                  </div>
                  <p className="board-col__hint">{col.hint}</p>

                  {items.map((it) => (
                    <div className="board-item" key={it.id}>
                      <div className="board-item__title">{it.title}</div>
                      {it.detail && <div className="board-item__detail">{it.detail}</div>}
                      {(it.owner || it.due) && (
                        <div className="board-item__meta">
                          {it.owner && <span>👤 {it.owner}</span>}
                          {it.due && <span>📅 {it.due}</span>}
                        </div>
                      )}
                      <div className="board-item__actions">
                        {COLUMNS.filter((c) => c.status !== col.status).map((c) => (
                          <button
                            key={c.status}
                            className="board-move"
                            disabled={busy}
                            onClick={() => mutate({ action: "status", itemId: it.id, status: c.status })}
                            title={`Move to ${c.label}`}
                          >
                            → {c.label}
                          </button>
                        ))}
                        <button
                          className="board-move board-move--del"
                          disabled={busy}
                          onClick={() => mutate({ action: "remove", itemId: it.id })}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}

                  {adding === col.status ? (
                    <div className="board-add">
                      <input
                        className="brain__input"
                        autoFocus
                        placeholder="Title"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addItem(col.status); }}
                      />
                      <input
                        className="brain__input"
                        placeholder="Detail (optional)"
                        value={newDetail}
                        onChange={(e) => setNewDetail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addItem(col.status); }}
                      />
                      <div className="board-add__actions">
                        <button className="btn-approve" disabled={busy} onClick={() => addItem(col.status)}>Add</button>
                        <button className="btn-discard" onClick={() => { setAdding(null); setNewTitle(""); setNewDetail(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="board-addbtn" onClick={() => setAdding(col.status)}>+ Add item</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
