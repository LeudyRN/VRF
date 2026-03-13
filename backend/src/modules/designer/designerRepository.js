import { randomUUID } from "node:crypto";
import { getDbPool } from "../../config/db.js";
import { store } from "../../repositories/inMemoryStore.js";

function toProject(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id ?? row.userId ?? null,
    name: row.name,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function toPlacement(row) {
  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    equipmentId: Number(row.equipment_id ?? row.equipmentId),
    label: row.label,
    x: Number(row.x),
    y: Number(row.y),
  };
}

function toConnection(row) {
  if (!row) return null;

  return {
    id: row.id,
    projectId: row.project_id ?? row.projectId,
    fromNodeId: row.start_node ?? row.fromNodeId,
    toNodeId: row.end_node ?? row.toNodeId,
    kind: row.kind,
    lengthM: Number(row.length ?? row.lengthM),
  };
}

function getDb() {
  return getDbPool();
}

export const designerRepository = {
  listEquipmentTypes() {
    return store.equipmentTypes;
  },

  listEquipment() {
    return store.equipment;
  },

  findEquipmentById(equipmentId) {
    return store.equipment.find((item) => item.id === equipmentId) || null;
  },

  async listProjectsByUser(userId) {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT id, user_id, name, created_at
       FROM projects
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows.map(toProject);
  },

  async createProject({ name, userId }) {
    const db = getDb();
    const id = randomUUID();

    await db.query(`INSERT INTO projects (id, user_id, name) VALUES (?, ?, ?)`, [id, userId, name]);

    const [rows] = await db.query(
      `SELECT id, user_id, name, created_at
       FROM projects
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return toProject(rows[0]);
  },

  async findProjectByIdAndUser(projectId, userId) {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT id, user_id, name, created_at
       FROM projects
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [projectId, userId]
    );

    return toProject(rows[0]);
  },

  async deleteProjectByIdAndUser(projectId, userId) {
    const db = getDb();
    const [result] = await db.query(`DELETE FROM projects WHERE id = ? AND user_id = ?`, [projectId, userId]);
    return result.affectedRows > 0;
  },

  async listPlacements(projectId) {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT id, project_id, equipment_id, label, x, y
       FROM placements
       WHERE project_id = ?
       ORDER BY created_at ASC`,
      [projectId]
    );

    return rows.map(toPlacement);
  },

  async findPlacementInProject(projectId, placementId) {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT id, project_id, equipment_id, label, x, y
       FROM placements
       WHERE project_id = ? AND id = ?
       LIMIT 1`,
      [projectId, placementId]
    );

    return toPlacement(rows[0]);
  },

  async addPlacement({ projectId, equipmentId, label, x, y }) {
    const db = getDb();
    const id = randomUUID();

    await db.query(
      `INSERT INTO placements (id, project_id, equipment_id, label, x, y)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, equipmentId, label, x, y]
    );

    const [rows] = await db.query(
      `SELECT id, project_id, equipment_id, label, x, y
       FROM placements
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return toPlacement(rows[0]);
  },

  async updatePlacementPosition(projectId, placementId, x, y) {
    const db = getDb();

    await db.query(
      `UPDATE placements
       SET x = ?, y = ?
       WHERE project_id = ? AND id = ?`,
      [x, y, projectId, placementId]
    );

    const [rows] = await db.query(
      `SELECT id, project_id, equipment_id, label, x, y
       FROM placements
       WHERE project_id = ? AND id = ?
       LIMIT 1`,
      [projectId, placementId]
    );

    return toPlacement(rows[0]);
  },

  async listConnections(projectId) {
    const db = getDb();
    const [rows] = await db.query(
      `SELECT id, project_id, start_node, end_node, kind, length
       FROM connections
       WHERE project_id = ?
       ORDER BY id ASC`,
      [projectId]
    );

    return rows.map(toConnection);
  },

  async addConnection({ projectId, fromNodeId, toNodeId, kind, lengthM }) {
    const db = getDb();
    const id = randomUUID();

    await db.query(
      `INSERT INTO connections (id, project_id, start_node, end_node, kind, length)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, projectId, fromNodeId, toNodeId, kind, lengthM]
    );

    const [rows] = await db.query(
      `SELECT id, project_id, start_node, end_node, kind, length
       FROM connections
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return toConnection(rows[0]);
  },

  async updateConnectionLength(connectionId, lengthM) {
    const db = getDb();

    await db.query(`UPDATE connections SET length = ? WHERE id = ?`, [lengthM, connectionId]);

    const [rows] = await db.query(
      `SELECT id, project_id, start_node, end_node, kind, length
       FROM connections
       WHERE id = ?
       LIMIT 1`,
      [connectionId]
    );

    return toConnection(rows[0]);
  },
};
