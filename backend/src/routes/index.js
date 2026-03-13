import { Router } from "express";
import { authRouter } from "../modules/auth/authRoutes.js";
import { billingRouter } from "../modules/billing/billingRoutes.js";
import { designerRouter } from "../modules/designer/designerRoutes.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/stripe", billingRouter);
apiRouter.use(designerRouter);
