import { apiFetch } from "../../services/apiClient";
import { BomSummary, CalculationSummary, Connection, EquipmentItem, Placement, Project } from "../types";

export const api = {
  getEquipment() {
    return apiFetch<{ items: EquipmentItem[] }>("/equipment");
  },

  getProjects() {
    return apiFetch<Project[]>("/projects");
  },

  createProject(name: string) {
    return apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  deleteProject(projectId: string) {
    return apiFetch<{ success: boolean }>(`/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  placeEquipment(payload: { projectId: string; equipmentId: number; x: number; y: number; label: string }) {
    return apiFetch<Placement>("/equipment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  movePlacement(payload: { projectId: string; placementId: string; x: number; y: number }) {
    return apiFetch<{ placement: Placement; connections: Connection[] }>(`/placements/${payload.placementId}`, {
      method: "PATCH",
      body: JSON.stringify({ projectId: payload.projectId, x: payload.x, y: payload.y }),
    });
  },

  createConnection(payload: { projectId: string; fromNodeId: string; toNodeId: string; kind: "PIPE" | "CABLE" }) {
    return apiFetch<Connection>("/connections", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getModel(projectId: string) {
    return apiFetch<{ placements: Placement[]; connections: Connection[] }>(`/projects/${projectId}/model`);
  },

  getCalculations(projectId: string) {
    return apiFetch<CalculationSummary>(`/calculations/${projectId}`);
  },

  getBom(projectId: string) {
    return apiFetch<BomSummary>(`/bom/${projectId}`);
  },
};
