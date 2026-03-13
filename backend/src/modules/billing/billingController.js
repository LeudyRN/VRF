import { asAppError } from "../../shared/errors/appError.js";
import { billingUseCases } from "./billingUseCases.js";

export const billingController = {
  async createCheckout(req, res) {
    try {
      res.json(await billingUseCases.createCheckout(req.auth.userId));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async webhook(req, res) {
    try {
      res.json(
        await billingUseCases.handleWebhook({
          rawBody: req.rawBody || "",
          stripeSignature: req.headers["stripe-signature"],
        })
      );
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },
};
