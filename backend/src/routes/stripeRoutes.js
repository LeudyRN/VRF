import { Router } from "express";
import { stripeController } from "../controllers/stripeController.js";
import { requireAuth } from "../middleware/auth.js";

export const stripeRouter = Router();

stripeRouter.post("/create-checkout-session", requireAuth, stripeController.createCheckout);
stripeRouter.post("/webhook", stripeController.webhook);
