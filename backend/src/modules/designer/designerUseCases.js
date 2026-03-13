import { computeTotalEquipmentCost } from "../../engine/costEngine/costEngine.js";
import { runSizing } from "../../engine/sizingEngine/sizingEngine.js";
import { validateConnection } from "../../engine/validationEngine/validationEngine.js";
import { AppError } from "../../shared/errors/appError.js";
import { designerRepository } from "./designerRepository.js";

function calculateSegmentLength(from, to) {
  return Number(((Math.abs(from.x - to.x) + Math.abs(from.y - to.y)) / 30).toFixed(2));
}

async function getProjectOrThrow(projectId, userId) {
  const project = await designerRepository.findProjectByIdAndUser(projectId, userId);
  if (!project) {
    throw new AppError("Project not found", 404, "PROJECT_NOT_FOUND");
  }
  return project;
}

export const designerUseCases = {
  async listEquipmentCatalog() {
    return {
      types: designerRepository.listEquipmentTypes(),
      items: designerRepository.listEquipment(),
    };
  },

  async listProjects(userId) {
    return designerRepository.listProjectsByUser(userId);
  },

  async createProject({ name, userId }) {
    if (!name?.trim()) {
      throw new AppError("Project name is required", 400, "PROJECT_NAME_REQUIRED");
    }

    return designerRepository.createProject({ name: name.trim(), userId });
  },

  async deleteProject({ projectId, userId }) {
    await getProjectOrThrow(projectId, userId);
    await designerRepository.deleteProjectByIdAndUser(projectId, userId);
    return { success: true };
  },

  async placeEquipment({ projectId, userId, equipmentId, label, x, y }) {
    await getProjectOrThrow(projectId, userId);

    const equipment = designerRepository.findEquipmentById(equipmentId);
    if (!equipment) {
      throw new AppError("Equipment not found", 404, "EQUIPMENT_NOT_FOUND");
    }

    return designerRepository.addPlacement({
      projectId,
      equipmentId,
      label: label || equipment.name,
      x,
      y,
    });
  },

  async movePlacement({ projectId, userId, placementId, x, y }) {
    await getProjectOrThrow(projectId, userId);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new AppError("Placement coordinates are invalid", 400, "PLACEMENT_COORDINATES_INVALID");
    }

    const placement = await designerRepository.updatePlacementPosition(projectId, placementId, x, y);
    if (!placement) {
      throw new AppError("Placement not found", 404, "PLACEMENT_NOT_FOUND");
    }

    const currentConnections = await designerRepository.listConnections(projectId);
    const connections = await Promise.all(
      currentConnections.map(async (connection) => {
        if (connection.fromNodeId !== placementId && connection.toNodeId !== placementId) {
          return connection;
        }

        const [from, to] = await Promise.all([
          designerRepository.findPlacementInProject(projectId, connection.fromNodeId),
          designerRepository.findPlacementInProject(projectId, connection.toNodeId),
        ]);

        if (!from || !to) {
          return connection;
        }

        const lengthM = calculateSegmentLength(from, to);
        return (await designerRepository.updateConnectionLength(connection.id, lengthM)) || connection;
      })
    );

    return {
      placement,
      connections,
    };
  },

  async createConnection({ projectId, userId, fromNodeId, toNodeId, kind }) {
    await getProjectOrThrow(projectId, userId);
    validateConnection(fromNodeId, toNodeId);

    const [from, to] = await Promise.all([
      designerRepository.findPlacementInProject(projectId, fromNodeId),
      designerRepository.findPlacementInProject(projectId, toNodeId),
    ]);

    if (!from || !to) {
      throw new AppError("Connection node not found in project", 404, "PLACEMENT_NOT_FOUND");
    }

    const lengthM = calculateSegmentLength(from, to);
    return designerRepository.addConnection({ projectId, fromNodeId, toNodeId, kind, lengthM });
  },

  async getProjectModel({ projectId, userId }) {
    await getProjectOrThrow(projectId, userId);

    const [placements, connections] = await Promise.all([
      designerRepository.listPlacements(projectId),
      designerRepository.listConnections(projectId),
    ]);

    return {
      placements,
      connections,
    };
  },

  async getCalculations({ projectId, userId }) {
    await getProjectOrThrow(projectId, userId);

    const [placements, connections] = await Promise.all([
      designerRepository.listPlacements(projectId),
      designerRepository.listConnections(projectId),
    ]);

    const equipment = placements
      .map((placement) => designerRepository.findEquipmentById(placement.equipmentId))
      .filter(Boolean);

    const pipeLength = connections
      .filter((connection) => connection.kind === "PIPE")
      .reduce((sum, connection) => sum + connection.lengthM, 0);

    const cableLength = connections
      .filter((connection) => connection.kind === "CABLE")
      .reduce((sum, connection) => sum + connection.lengthM, 0);

    return runSizing(equipment, pipeLength, cableLength, computeTotalEquipmentCost(equipment));
  },

  async getBom({ projectId, userId }) {
    await getProjectOrThrow(projectId, userId);

    const [placements, connections] = await Promise.all([
      designerRepository.listPlacements(projectId),
      designerRepository.listConnections(projectId),
    ]);

    const groupedEquipment = new Map();

    for (const placement of placements) {
      const equipment = designerRepository.findEquipmentById(placement.equipmentId);
      if (!equipment) {
        continue;
      }

      const current = groupedEquipment.get(equipment.id);
      groupedEquipment.set(equipment.id, {
        name: equipment.name,
        qty: (current?.qty || 0) + 1,
        unitPrice: equipment.estimatedPrice,
      });
    }

    const equipmentRows = Array.from(groupedEquipment.values()).map((item) => ({
      itemType: "EQUIPMENT",
      itemName: item.name,
      quantity: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: Number((item.qty * item.unitPrice).toFixed(2)),
    }));

    const pipeLength = connections
      .filter((connection) => connection.kind === "PIPE")
      .reduce((sum, connection) => sum + connection.lengthM, 0);

    const cableLength = connections
      .filter((connection) => connection.kind === "CABLE")
      .reduce((sum, connection) => sum + connection.lengthM, 0);

    const rows = [
      ...equipmentRows,
      {
        itemType: "PIPE",
        itemName: "Copper Refrigerant Pipe",
        quantity: Number(pipeLength.toFixed(2)),
        unitPrice: 24,
        totalPrice: Number((pipeLength * 24).toFixed(2)),
      },
      {
        itemType: "CABLE",
        itemName: "Power/Control Cable",
        quantity: Number(cableLength.toFixed(2)),
        unitPrice: 8,
        totalPrice: Number((cableLength * 8).toFixed(2)),
      },
    ];

    return {
      items: rows,
      total: Number(rows.reduce((sum, row) => sum + row.totalPrice, 0).toFixed(2)),
    };
  },
};
