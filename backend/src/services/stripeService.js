import crypto from "node:crypto";
import { env } from "../config/env.js";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeFormPost(path, body) {
  if (!env.stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Stripe error: ${text}`);
  return JSON.parse(text);
}

export async function createStripeCustomer({ email, name }) {
  return stripeFormPost("/customers", { email, name });
}

export async function createCheckoutSession({ customerId, userId }) {
  if (!env.stripePriceId) throw new Error("Missing STRIPE_PRICE_ID");
  return stripeFormPost("/checkout/sessions", {
    mode: "subscription",
    customer: customerId,
    "line_items[0][price]": env.stripePriceId,
    "line_items[0][quantity]": "1",
    success_url: `${env.appUrl}/subscription?success=1`,
    cancel_url: `${env.appUrl}/subscription?canceled=1`,
    "metadata[userId]": String(userId),
  });
}

export function verifyStripeWebhookSignature(rawBody, stripeSignatureHeader) {
  if (!env.stripeWebhookSecret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  if (!stripeSignatureHeader) throw new Error("Missing Stripe-Signature header");

  const parts = Object.fromEntries(
    stripeSignatureHeader.split(",").map((x) => x.split("="))
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new Error("Malformed Stripe-Signature header");

  const signedPayload = `${timestamp}.${rawBody}`;
  const digest = crypto
    .createHmac("sha256", env.stripeWebhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  const sigA = Buffer.from(signature, "hex");
  const sigB = Buffer.from(digest, "hex");
  if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
    throw new Error("Invalid Stripe signature");
  }
}
