import { currentUserId } from "@/lib/auth";
import { getVertical, saveVertical, type BoardItem, type ItemStatus } from "@/lib/verticals";

export const runtime = "nodejs";

const STATUSES: ItemStatus[] = ["active", "pending", "attention"];

// A single vertical's board.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const vertical = await getVertical(uid, id);
  if (!vertical) return Response.json({ error: "Vertical not found" }, { status: 404 });
  return Response.json({ vertical });
}

// Mutate the board: add an item, change a status, or remove one.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const vertical = await getVertical(uid, id);
  if (!vertical) return Response.json({ error: "Vertical not found" }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: "add" | "status" | "remove";
    itemId?: string;
    title?: string;
    detail?: string;
    status?: ItemStatus;
  };
  const now = new Date().toISOString();

  if (body.action === "add") {
    const title = (body.title ?? "").trim();
    if (!title) return Response.json({ error: "Title required" }, { status: 400 });
    const status: ItemStatus = STATUSES.includes(body.status as ItemStatus) ? (body.status as ItemStatus) : "active";
    const next: BoardItem = {
      id: `it-${Date.now().toString(36)}-${vertical.items.length}`,
      title: title.slice(0, 200),
      detail: (body.detail ?? "").trim().slice(0, 1000) || undefined,
      status,
      updatedAt: now,
    };
    vertical.items.push(next);
  } else if (body.action === "status") {
    if (!STATUSES.includes(body.status as ItemStatus)) return Response.json({ error: "Bad status" }, { status: 400 });
    const it = vertical.items.find((i) => i.id === body.itemId);
    if (!it) return Response.json({ error: "Item not found" }, { status: 404 });
    it.status = body.status as ItemStatus;
    it.updatedAt = now;
  } else if (body.action === "remove") {
    vertical.items = vertical.items.filter((i) => i.id !== body.itemId);
  } else {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  await saveVertical(uid, vertical);
  return Response.json({ ok: true, vertical });
}
