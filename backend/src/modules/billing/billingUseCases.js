import { subscriptionRepository } from "../../repositories/subscriptionRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import {
  createCheckoutSession,
  createStripeCustomer,
  verifyStripeWebhookSignature,
} from "../../services/stripeService.js";

function toSubscriptionStatus(stripeStatus) {
  if (stripeStatus === "active") return "active";
  if (stripeStatus === "trialing") return "trial";
  if (stripeStatus === "past_due") return "past_due";
  if (stripeStatus === "canceled") return "canceled";
  return "inactive";
}

export const billingUseCases = {
  async createCheckout(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await createStripeCustomer({ email: user.email, name: user.name });
      customerId = customer.id;
      await userRepository.setStripeCustomerId(user.id, customerId);
    }

    const session = await createCheckoutSession({ customerId, userId: user.id });
    return { checkoutUrl: session.url, sessionId: session.id };
  },

  async handleWebhook({ rawBody, stripeSignature }) {
    verifyStripeWebhookSignature(rawBody, stripeSignature);

    const event = JSON.parse(rawBody);
    const eventType = event.type;
    const payload = event.data?.object || {};

    if (eventType === "checkout.session.completed") {
      await userRepository.updateSubscriptionStatusByCustomer(payload.customer, "active");
      const user = await userRepository.findByStripeCustomer(payload.customer);
      if (user) {
        await subscriptionRepository.upsert({
          userId: user.id,
          stripeSubscriptionId: payload.subscription,
          plan: "VRF Designer Plan",
          status: "active",
          currentPeriodEnd: null,
        });
      }
    }

    if (eventType === "invoice.payment_succeeded") {
      await userRepository.updateSubscriptionStatusByCustomer(payload.customer, "active");
    }

    if (eventType === "invoice.payment_failed") {
      await userRepository.updateSubscriptionStatusByCustomer(payload.customer, "past_due");
    }

    if (eventType === "customer.subscription.deleted") {
      await userRepository.updateSubscriptionStatusByCustomer(payload.customer, "canceled");
    }

    if (eventType === "customer.subscription.updated") {
      const subscriptionStatus = toSubscriptionStatus(payload.status);
      const currentPeriodEnd = payload.current_period_end ? new Date(payload.current_period_end * 1000) : null;

      await userRepository.updateSubscriptionStatusByCustomer(payload.customer, subscriptionStatus);
      const user = await userRepository.findByStripeCustomer(payload.customer);
      if (user) {
        await subscriptionRepository.upsert({
          userId: user.id,
          stripeSubscriptionId: payload.id,
          plan: "VRF Designer Plan",
          status: subscriptionStatus,
          currentPeriodEnd,
        });
      }
    }

    return { received: true };
  },
};
