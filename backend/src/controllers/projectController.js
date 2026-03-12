import { projectService } from "../services/projectService.js";

export const projectController = {
  list(req, res) { res.json(projectService.listProjects(req.auth.userId)); },
  create(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Project name is required" });
    res.status(201).json(projectService.createProject(name, req.auth.userId));
  },
  placeEquipment(req, res) {
    try {
      const { projectId, equipmentId, label, x, y } = req.body;
      res.status(201).json(projectService.placeEquipment(projectId, req.auth.userId, Number(equipmentId), label || "Equipment", Number(x), Number(y)));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
  createConnection(req, res) {
    try {
      const { projectId, fromNodeId, toNodeId, kind } = req.body;
      res.status(201).json(projectService.createConnection(projectId, req.auth.userId, fromNodeId, toNodeId, kind));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },
  getModel(req, res) {
    try { res.json(projectService.getProjectModel(req.params.projectId, req.auth.userId)); }
    catch (e) { res.status(404).json({ error: e.message }); }
  },
  calculations(req, res) {
    try { res.json(projectService.getCalculations(req.params.projectId, req.auth.userId)); }
    catch (e) { res.status(404).json({ error: e.message }); }
  },
  bom(req, res) {
    try { res.json(projectService.getBom(req.params.projectId, req.auth.userId)); }
    catch (e) { res.status(404).json({ error: e.message }); }
  },
};
