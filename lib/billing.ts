import { getU, setU } from "@/lib/store";

// Lightweight plan tracking. Stripe is the source of truth for payment; we just
// record which plan a user is on so the app can gate features. All Stripe calls
// go through the REST API (no SDK) and are key-gated so the app builds and runs
// without billing configured.

export type Plan = "free" | "pro";

export type Billing = {
  plan: Plan;
  status?: string; // active, trialing, canceled…
  customerId?: string;
  updatedAt?: string;
};

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

export async function getBilling(uid: string): Promise<Billing> {
  return (await getU<Billing>(uid, "billing")) ?? { plan: "free" };
}

export async function setBilling(uid: string, b: Billing): Promise<void> {
  await setU(uid, "billing", { ...b, updatedAt: new Date().toISOString() });
}

// Create a Stripe Checkout session via the REST API. Returns the hosted URL.
export async function createCheckout(uid: string, email: string, origin: string): Promise<string | null> {
  if (!stripeConfigured()) return null;
  const body = new URLSearchParams();
  body.set("mode", "subscription");
  body.set("line_items[0][price]", process.env.STRIPE_PRICE_ID!);
  body.set("line_items[0][quantity]", "1");
  body.set("client_reference_id", uid);
  body.set("customer_email", email);
  body.set("success_url", `${origin}/app/billing?status=success`);
  body.set("cancel_url", `${origin}/app/billing?status=cancelled`);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { url?: string };
  return data.url ?? null;
}
