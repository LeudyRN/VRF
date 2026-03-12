import { Router } from "express";
import { projectController } from "../controllers/projectController.js";
import { equipmentController } from "../controllers/equipmentController.js";

export const apiRouter = Router();
apiRouter.get("/projects", projectController.list);
apiRouter.post("/projects", projectController.create);
apiRouter.get("/equipment", equipmentController.list);
apiRouter.post("/equipment", projectController.placeEquipment);
apiRouter.post("/connections", projectController.createConnection);
apiRouter.get("/projects/:projectId/model", projectController.getModel);
apiRouter.get("/calculations/:projectId", projectController.calculations);
apiRouter.get("/bom/:projectId", projectController.bom);
