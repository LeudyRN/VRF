import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { simpleRateLimit } from "../../middleware/rateLimit.js";
import { authController } from "./authController.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.get("/verify-email", authController.verifyEmail);
authRouter.post("/login", simpleRateLimit({ windowMs: 60_000, max: 10 }), authController.login);
authRouter.post("/forgot-password", simpleRateLimit({ windowMs: 60_000, max: 5 }), authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.post("/change-password", requireAuth, authController.changePassword);
authRouter.get("/me", requireAuth, authController.me);
authRouter.patch("/me", requireAuth, authController.updateProfile);
