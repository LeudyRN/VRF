export type EdgeKind = "PIPE" | "CABLE";

export interface EquipmentItem {
  id: number;
  name: string;
  typeId: number;
  coolingCapacityKw: number;
  heatingCapacityKw: number;
  powerKw: number;
  voltage: number;
  weightKg: number;
  dimensions: { width: number; height: number; depth: number };
  efficiency: number;
  noiseLevelDb: number;
  estimatedPrice: number;
}

export interface Project { id: string; name: string; createdAt: string }
export interface Placement { id: string; projectId: string; equipmentId: number; label: string; x: number; y: number }
export interface Connection { id: string; projectId: string; fromNodeId: string; toNodeId: string; kind: EdgeKind; lengthM: number }
