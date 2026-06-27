import { currentUserId } from "@/lib/auth";
import { getVerticals, summarize } from "@/lib/verticals";

export const runtime = "nodejs";

// Overview: every vertical rolled up to a headline status + counts.
export async function GET() {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  const verticals = await getVerticals(uid);
  return Response.json({ verticals: verticals.map(summarize) });
}
