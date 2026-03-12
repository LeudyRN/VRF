import { projectService } from "../services/projectService.js";

export const projectController = {
  list(req, res) { res.json(projectService.listProjects()); },
  create(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required" });
    res.status(201).json(projectService.createProject(name));
  },
  placeEquipment(req, res) {
    const { projectId, equipmentId, label, x, y } = req.body;
    res.status(201).json(projectService.placeEquipment(projectId, Number(equipmentId), label || "Equipment", Number(x), Number(y)));
  },
  createConnection(req, res) {
    try {
      const { projectId, fromNodeId, toNodeId, kind } = req.body;
      res.status(201).json(projectService.createConnection(projectId, fromNodeId, toNodeId, kind));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
  getModel(req, res) { res.json(projectService.getProjectModel(req.params.projectId)); },
  calculations(req, res) { res.json(projectService.getCalculations(req.params.projectId)); },
  bom(req, res) { res.json(projectService.getBom(req.params.projectId)); },
};
