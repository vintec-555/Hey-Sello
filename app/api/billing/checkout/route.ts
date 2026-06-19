import { currentUserId, currentUserEmail } from "@/lib/auth";
import { createCheckout, stripeConfigured } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const uid = await currentUserId();
  if (!uid) return Response.json({ error: "Not signed in" }, { status: 401 });
  if (!stripeConfigured()) {
    return Response.json({ error: "Billing isn’t configured on this deployment yet." }, { status: 503 });
  }
  const email = (await currentUserEmail(uid)) ?? "";
  const url = await createCheckout(uid, email, new URL(req.url).origin);
  if (!url) return Response.json({ error: "Could not start checkout." }, { status: 502 });
  return Response.json({ url });
}
