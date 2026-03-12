export type EquipmentCategory = "OUTDOOR" | "INDOOR" | "BRANCH_CONTROLLER" | "HEAT_RECOVERY" | "CONTROLLER";

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface EquipmentType {
  id: number;
  code: string;
  category: EquipmentCategory;
}

export interface EquipmentItem {
  id: number;
  name: string;
  typeId: number;
  coolingCapacityKw: number;
  heatingCapacityKw: number;
  powerKw: number;
  voltage: number;
  weightKg: number;
  dimensions: Dimensions;
  efficiency: number;
  noiseLevelDb: number;
  estimatedPrice: number;
}

export interface Position { x: number; y: number }

export interface ProjectEquipmentPlacement {
  id: string;
  equipmentId: number;
  label: string;
  position: Position;
}

export interface Connection {
  id: string;
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  kind: "PIPE" | "CABLE";
  lengthM: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}
