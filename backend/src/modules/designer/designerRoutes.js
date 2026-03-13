import { Router } from "express";
import { requireVerifiedAndActive } from "../../middleware/accessControl.js";
import { requireAuth } from "../../middleware/auth.js";
import { designerController } from "./designerController.js";

export const designerRouter = Router();

designerRouter.get("/equipment", requireAuth, requireVerifiedAndActive, designerController.listEquipment);
designerRouter.get("/projects", requireAuth, requireVerifiedAndActive, designerController.listProjects);
designerRouter.post("/projects", requireAuth, requireVerifiedAndActive, designerController.createProject);
designerRouter.delete("/projects/:projectId", requireAuth, requireVerifiedAndActive, designerController.deleteProject);
designerRouter.post("/equipment", requireAuth, requireVerifiedAndActive, designerController.placeEquipment);
designerRouter.patch("/placements/:placementId", requireAuth, requireVerifiedAndActive, designerController.movePlacement);
designerRouter.post("/connections", requireAuth, requireVerifiedAndActive, designerController.createConnection);
designerRouter.get("/projects/:projectId/model", requireAuth, requireVerifiedAndActive, designerController.getModel);
designerRouter.get("/calculations/:projectId", requireAuth, requireVerifiedAndActive, designerController.calculations);
designerRouter.get("/bom/:projectId", requireAuth, requireVerifiedAndActive, designerController.bom);
