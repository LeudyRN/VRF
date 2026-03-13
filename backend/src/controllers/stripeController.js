import { userRepository } from "../repositories/userRepository.js";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";
import {
  createCheckoutSession,
  createStripeCustomer,
  verifyStripeWebhookSignature,
} from "../services/stripeService.js";

function toSubStatus(stripeStatus) {
  if (stripeStatus === "active") return "active";
  if (stripeStatus === "trialing") return "trial";
  if (stripeStatus === "past_due") return "past_due";
  if (stripeStatus === "canceled") return "canceled";
  return "inactive";
}

export const stripeController = {
  async createCheckout(req, res) {
    const user = await userRepository.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer({ email: user.email, name: user.name });
      customerId = customer.id;
      await userRepository.setStripeCustomerId(user.id, customerId);
    }

    const session = await createCheckoutSession({ customerId, userId: user.id });
    return res.json({ checkoutUrl: session.url, sessionId: session.id });
  },

  async webhook(req, res) {
    const rawBody = req.rawBody || "";
    const sig = req.headers["stripe-signature"];

    try {
      verifyStripeWebhookSignature(rawBody, sig);
      const event = JSON.parse(rawBody);
      const type = event.type;
      const object = event.data?.object || {};

      if (type === "checkout.session.completed") {
        const customer = object.customer;
        const subscriptionId = object.subscription;
        await userRepository.updateSubscriptionStatusByCustomer(customer, "active");
        const user = await userRepository.findByStripeCustomer(customer);
        if (user) {
          await subscriptionRepository.upsert({
            userId: user.id,
            stripeSubscriptionId: subscriptionId,
            plan: "VRF Designer Plan",
            status: "active",
            currentPeriodEnd: null,
          });
        }
      }

      if (type === "invoice.payment_succeeded") {
        const customer = object.customer;
        await userRepository.updateSubscriptionStatusByCustomer(customer, "active");
      }

      if (type === "invoice.payment_failed") {
        const customer = object.customer;
        await userRepository.updateSubscriptionStatusByCustomer(customer, "past_due");
      }

      if (type === "customer.subscription.deleted") {
        const customer = object.customer;
        await userRepository.updateSubscriptionStatusByCustomer(customer, "canceled");
      }

      if (type === "customer.subscription.updated") {
        const customer = object.customer;
        const status = toSubStatus(object.status);
        const currentPeriodEnd = object.current_period_end
          ? new Date(object.current_period_end * 1000)
          : null;
        await userRepository.updateSubscriptionStatusByCustomer(customer, status);
        const user = await userRepository.findByStripeCustomer(customer);
        if (user) {
          await subscriptionRepository.upsert({
            userId: user.id,
            stripeSubscriptionId: object.id,
            plan: "VRF Designer Plan",
            status,
            currentPeriodEnd,
          });
        }
      }

      return res.json({ received: true });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  },
};
