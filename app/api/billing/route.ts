import { currentUserId } from "@/lib/auth";
import { getBilling, stripeConfigured } from "@/lib/billing";

export const runtime = "nodejs";

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  const billing = await getBilling(uid);
  return Response.json({ billing, configured: stripeConfigured() });
}
