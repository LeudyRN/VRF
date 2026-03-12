import { Connection, EquipmentItem, Placement, Project } from "../types";

const BASE = "http://localhost:3100/api";

export const api = {
  async getEquipment(): Promise<{ items: EquipmentItem[] }> {
    const res = await fetch(`${BASE}/equipment`);
    return res.json();
  },
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE}/projects`);
    return res.json();
  },
  async createProject(name: string): Promise<Project> {
    const res = await fetch(`${BASE}/projects`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    return res.json();
  },
  async placeEquipment(payload: { projectId: string; equipmentId: number; x: number; y: number; label: string }): Promise<Placement> {
    const res = await fetch(`${BASE}/equipment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
  },
  async createConnection(payload: { projectId: string; fromNodeId: string; toNodeId: string; kind: "PIPE"|"CABLE" }): Promise<Connection> {
    const res = await fetch(`${BASE}/connections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return res.json();
  },
  async getModel(projectId: string): Promise<{ placements: Placement[]; connections: Connection[] }> {
    const res = await fetch(`${BASE}/projects/${projectId}/model`);
    return res.json();
  },
  async getCalculations(projectId: string) { const res = await fetch(`${BASE}/calculations/${projectId}`); return res.json(); },
  async getBom(projectId: string) { const res = await fetch(`${BASE}/bom/${projectId}`); return res.json(); },
};
