import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { billingController } from "./billingController.js";

export const billingRouter = Router();

billingRouter.post("/create-checkout-session", requireAuth, billingController.createCheckout);
billingRouter.post("/webhook", billingController.webhook);
