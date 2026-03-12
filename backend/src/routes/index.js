import { Router } from "express";
import { projectController } from "../controllers/projectController.js";
import { equipmentController } from "../controllers/equipmentController.js";
import { authRouter } from "./authRoutes.js";
import { stripeRouter } from "./stripeRoutes.js";
import { requireAuth } from "../middleware/auth.js";
import { requireVerifiedAndActive } from "../middleware/accessControl.js";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/stripe", stripeRouter);

apiRouter.get("/equipment", requireAuth, requireVerifiedAndActive, equipmentController.list);
apiRouter.get("/projects", requireAuth, requireVerifiedAndActive, projectController.list);
apiRouter.post("/projects", requireAuth, requireVerifiedAndActive, projectController.create);
apiRouter.post("/equipment", requireAuth, requireVerifiedAndActive, projectController.placeEquipment);
apiRouter.post("/connections", requireAuth, requireVerifiedAndActive, projectController.createConnection);
apiRouter.get("/projects/:projectId/model", requireAuth, requireVerifiedAndActive, projectController.getModel);
apiRouter.get("/calculations/:projectId", requireAuth, requireVerifiedAndActive, projectController.calculations);
apiRouter.get("/bom/:projectId", requireAuth, requireVerifiedAndActive, projectController.bom);
