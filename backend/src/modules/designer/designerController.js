import { asAppError } from "../../shared/errors/appError.js";
import { designerUseCases } from "./designerUseCases.js";

export const designerController = {
  async listEquipment(_req, res) {
    try {
      res.json(await designerUseCases.listEquipmentCatalog());
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async listProjects(req, res) {
    try {
      res.json(await designerUseCases.listProjects(req.auth.userId));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async createProject(req, res) {
    try {
      res.status(201).json(await designerUseCases.createProject({ name: req.body.name, userId: req.auth.userId }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async deleteProject(req, res) {
    try {
      res.json(await designerUseCases.deleteProject({ projectId: req.params.projectId, userId: req.auth.userId }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async placeEquipment(req, res) {
    try {
      res.status(201).json(
        await designerUseCases.placeEquipment({
          projectId: req.body.projectId,
          userId: req.auth.userId,
          equipmentId: Number(req.body.equipmentId),
          label: req.body.label,
          x: Number(req.body.x),
          y: Number(req.body.y),
        })
      );
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async movePlacement(req, res) {
    try {
      res.json(
        await designerUseCases.movePlacement({
          projectId: req.body.projectId,
          userId: req.auth.userId,
          placementId: req.params.placementId,
          x: Number(req.body.x),
          y: Number(req.body.y),
        })
      );
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async createConnection(req, res) {
    try {
      res.status(201).json(
        await designerUseCases.createConnection({
          projectId: req.body.projectId,
          userId: req.auth.userId,
          fromNodeId: req.body.fromNodeId,
          toNodeId: req.body.toNodeId,
          kind: req.body.kind,
        })
      );
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async getModel(req, res) {
    try {
      res.json(await designerUseCases.getProjectModel({ projectId: req.params.projectId, userId: req.auth.userId }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async calculations(req, res) {
    try {
      res.json(await designerUseCases.getCalculations({ projectId: req.params.projectId, userId: req.auth.userId }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async bom(req, res) {
    try {
      res.json(await designerUseCases.getBom({ projectId: req.params.projectId, userId: req.auth.userId }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },
};
