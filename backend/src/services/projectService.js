import { randomUUID } from "node:crypto";
import { store } from "../repositories/inMemoryStore.js";
import { validateConnection } from "../engine/validationEngine/validationEngine.js";
import { computeTotalEquipmentCost } from "../engine/costEngine/costEngine.js";
import { runSizing } from "../engine/sizingEngine/sizingEngine.js";

export const projectService = {
  listProjects(userId) {
    return store.projects.filter((p) => p.userId === userId);
  },
  createProject(name, userId) {
    const p = { id: randomUUID(), name, userId, createdAt: new Date().toISOString() };
    store.projects.push(p);
    return p;
  },
  ensureOwner(projectId, userId) {
    const p = store.projects.find((row) => row.id === projectId && row.userId === userId);
    if (!p) throw new Error("Project not found");
  },
  placeEquipment(projectId, userId, equipmentId, label, x, y) {
    this.ensureOwner(projectId, userId);
    const placement = { id: randomUUID(), projectId, equipmentId, label, x, y };
    store.placements.push(placement);
    return placement;
  },
  createConnection(projectId, userId, fromNodeId, toNodeId, kind) {
    this.ensureOwner(projectId, userId);
    validateConnection(fromNodeId, toNodeId);
    const from = store.placements.find((p) => p.id === fromNodeId && p.projectId === projectId);
    const to = store.placements.find((p) => p.id === toNodeId && p.projectId === projectId);
    if (!from || !to) throw new Error("Connection node not found in project");
    const lengthM = Number((Math.hypot(from.x - to.x, from.y - to.y) / 30).toFixed(2));
    const conn = { id: randomUUID(), projectId, fromNodeId, toNodeId, kind, lengthM };
    store.connections.push(conn);
    return conn;
  },
  getProjectModel(projectId, userId) {
    this.ensureOwner(projectId, userId);
    const placements = store.placements.filter((p) => p.projectId === projectId);
    const connections = store.connections.filter((c) => c.projectId === projectId);
    return { placements, connections };
  },
  getCalculations(projectId, userId) {
    this.ensureOwner(projectId, userId);
    const placements = store.placements.filter((p) => p.projectId === projectId);
    const equipment = placements.map((p) => store.equipment.find((e) => e.id === p.equipmentId)).filter(Boolean);
    const pipeLength = store.connections.filter((c) => c.projectId === projectId && c.kind === "PIPE").reduce((s, c) => s + c.lengthM, 0);
    const cableLength = store.connections.filter((c) => c.projectId === projectId && c.kind === "CABLE").reduce((s, c) => s + c.lengthM, 0);
    const totalCost = computeTotalEquipmentCost(equipment);
    return runSizing(equipment, pipeLength, cableLength, totalCost);
  },
  getBom(projectId, userId) {
    this.ensureOwner(projectId, userId);
    const placements = store.placements.filter((p) => p.projectId === projectId);
    const equipmentMap = new Map();
    for (const p of placements) {
      const eq = store.equipment.find((e) => e.id === p.equipmentId);
      if (!eq) continue;
      const ex = equipmentMap.get(eq.id);
      equipmentMap.set(eq.id, { name: eq.name, qty: (ex?.qty || 0) + 1, unitPrice: eq.estimatedPrice });
    }
    const equipmentItems = Array.from(equipmentMap.values()).map((x) => ({ itemType: "EQUIPMENT", itemName: x.name, quantity: x.qty, unitPrice: x.unitPrice, totalPrice: Number((x.qty * x.unitPrice).toFixed(2)) }));
    const pipeLength = store.connections.filter((c) => c.projectId === projectId && c.kind === "PIPE").reduce((s, c) => s + c.lengthM, 0);
    const cableLength = store.connections.filter((c) => c.projectId === projectId && c.kind === "CABLE").reduce((s, c) => s + c.lengthM, 0);
    const rows = [...equipmentItems, { itemType: "PIPE", itemName: "Copper Refrigerant Pipe", quantity: Number(pipeLength.toFixed(2)), unitPrice: 24, totalPrice: Number((pipeLength * 24).toFixed(2)) }, { itemType: "CABLE", itemName: "Power/Control Cable", quantity: Number(cableLength.toFixed(2)), unitPrice: 8, totalPrice: Number((cableLength * 8).toFixed(2)) }];
    return { items: rows, total: Number(rows.reduce((s, r) => s + r.totalPrice, 0).toFixed(2)) };
  },
};
