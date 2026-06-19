import { createHmac, timingSafeEqual } from "crypto";
import { setBilling } from "@/lib/billing";

export const runtime = "nodejs";

// Verify Stripe's signature header: "t=<timestamp>,v1=<signature>". Stripe signs
// `${t}.${rawBody}` with HMAC-SHA256 using the webhook signing secret.
function verify(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const sig = parts["v1"];
  if (!t || !sig) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const raw = await req.text();
  if (secret && !verify(raw, req.headers.get("stripe-signature"), secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Bad payload" }, { status: 400 });
  }

  const obj = (event.data?.object ?? {}) as Record<string, unknown>;
  const uid = (obj.client_reference_id as string) || "";

  switch (event.type) {
    case "checkout.session.completed":
      if (uid) {
        await setBilling(uid, {
          plan: "pro",
          status: "active",
          customerId: (obj.customer as string) || undefined,
        });
      }
      break;
    case "customer.subscription.deleted":
      // Downgrade is keyed by customer id; best-effort only.
      break;
    default:
      break;
  }

  return Response.json({ received: true });
}
