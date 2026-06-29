import { getU, setU } from "@/lib/store";

// ---------------------------------------------------------------------------
// Business Verticals — one dashboard for every line of the business.
// Each vertical has its own board of items, each item in one of three states:
//   active     — running / on track
//   pending    — queued, waiting on someone or something
//   attention  — needs the owner's eyes now (blocked, overdue, at risk)
// The overview rolls each board up into a single headline status + counts.
// ---------------------------------------------------------------------------

export type ItemStatus = "active" | "pending" | "attention";

export type BoardItem = {
  id: string;
  title: string;
  detail?: string;
  status: ItemStatus;
  owner?: string;
  due?: string; // free text: "Today", "Fri", "2026-07-01"
  updatedAt: string;
};

export type Vertical = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  items: BoardItem[];
};

export type VerticalSummary = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  status: ItemStatus; // rolled-up headline status
  counts: { active: number; pending: number; attention: number; total: number };
  attentionItems: string[]; // titles of the items needing attention
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  active: "Active",
  pending: "Pending",
  attention: "Needs attention",
};

export const STATUS_ORDER: ItemStatus[] = ["attention", "pending", "active"];

// Roll a board up: attention beats pending beats active.
export function rollUp(items: BoardItem[]): ItemStatus {
  if (items.some((i) => i.status === "attention")) return "attention";
  if (items.some((i) => i.status === "pending")) return "pending";
  return "active";
}

export function summarize(v: Vertical): VerticalSummary {
  const counts = {
    active: v.items.filter((i) => i.status === "active").length,
    pending: v.items.filter((i) => i.status === "pending").length,
    attention: v.items.filter((i) => i.status === "attention").length,
    total: v.items.length,
  };
  return {
    id: v.id,
    name: v.name,
    emoji: v.emoji,
    description: v.description,
    status: rollUp(v.items),
    counts,
    attentionItems: v.items.filter((i) => i.status === "attention").map((i) => i.title),
  };
}

// Stable id used by both the overview link and the board route.
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---- Persistence (per-user, KV-backed via lib/store) ----------------------

export async function getVerticals(uid: string): Promise<Vertical[]> {
  const stored = await getU<Vertical[]>(uid, "verticals");
  if (stored && stored.length) return stored;
  // First visit: seed a starter set so the dashboard is useful immediately.
  const seed = seedVerticals();
  await setU(uid, "verticals", seed);
  return seed;
}

export async function getVertical(uid: string, id: string): Promise<Vertical | null> {
  return (await getVerticals(uid)).find((v) => v.id === id) ?? null;
}

export async function saveVertical(uid: string, updated: Vertical): Promise<Vertical> {
  const all = await getVerticals(uid);
  const idx = all.findIndex((v) => v.id === updated.id);
  if (idx === -1) all.push(updated);
  else all[idx] = updated;
  await setU(uid, "verticals", all);
  return updated;
}

// ---- Starter content ------------------------------------------------------
// A realistic multi-vertical business, with the Batching plant 90m³ board
// fully fleshed out so it works the moment the user opens it.

const NOW = "2026-06-27T00:00:00.000Z";

function item(
  id: string,
  title: string,
  status: ItemStatus,
  detail?: string,
  owner?: string,
  due?: string,
): BoardItem {
  return { id, title, status, detail, owner, due, updatedAt: NOW };
}

export function seedVerticals(): Vertical[] {
  return [
    {
      id: "batching-plant-90m3",
      name: "Batching plant 90m³",
      emoji: "🏗️",
      description: "Concrete batching plant — 90 m³/hr output. Production, dispatch, maintenance & supply.",
      items: [
        item("bp-prod", "Daily production run — 90 m³/hr", "active",
          "Plant running at rated capacity. Today's pours scheduled and on track.", "Plant ops", "Today"),
        item("bp-dispatch", "Transit mixer dispatch schedule", "active",
          "4 mixers in rotation. Next dispatch at 11:30 to the highway site.", "Dispatch", "Today"),
        item("bp-qc", "Cube test results — M30 batch", "active",
          "7-day cube strength passed. 28-day samples logged.", "QC lab"),
        item("bp-cement", "Cement silo refill", "pending",
          "Silo at 22%. Refill tanker booked, awaiting supplier confirmation.", "Procurement", "Fri"),
        item("bp-order", "New order — 320 m³ slab pour", "pending",
          "Quote sent to the client, awaiting PO before we block the schedule.", "Sales", "This week"),
        item("bp-aggregate", "Aggregate (20mm) stock low", "attention",
          "Stock down to ~1.5 days. Reorder now or the Thu pour is at risk.", "Procurement", "Reorder today"),
        item("bp-maint", "Conveyor belt #2 wear", "attention",
          "Belt showing wear at the splice — schedule maintenance before failure halts production.", "Maintenance", "ASAP"),
      ],
    },
    {
      id: "rmc-supply",
      name: "Ready-mix supply",
      emoji: "🚚",
      description: "Ready-mix concrete sales, quotes and site deliveries.",
      items: [
        item("rmc-1", "Active deliveries today", "active", "6 deliveries scheduled across 3 sites.", "Logistics", "Today"),
        item("rmc-2", "Quote follow-ups", "pending", "3 quotes sent last week awaiting response.", "Sales"),
        item("rmc-3", "Overdue invoice — Site C", "attention", "₹4.2L invoice 30+ days overdue. Hold further supply?", "Accounts", "Overdue"),
      ],
    },
    {
      id: "equipment-rental",
      name: "Equipment rental",
      emoji: "🛠️",
      description: "Concrete pumps, transit mixers and plant equipment on hire.",
      items: [
        item("er-1", "Boom pump on hire — Metro site", "active", "On a 14-day contract, day 5.", "Rentals"),
        item("er-2", "Service due — Mixer TM-07", "pending", "250-hr service due in 3 days.", "Maintenance", "Mon"),
      ],
    },
  ];
}
