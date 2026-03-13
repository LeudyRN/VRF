import { getDbPool } from "../config/db.js";
import { store } from "../repositories/inMemoryStore.js";

let syncPromise;

export async function ensureEquipmentCatalog() {
  if (syncPromise) {
    return syncPromise;
  }

  syncPromise = (async () => {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      for (const type of store.equipmentTypes) {
        await connection.query(
          `INSERT INTO equipment_types (id, code, category)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             code = VALUES(code),
             category = VALUES(category)`,
          [type.id, type.code, type.category]
        );
      }

      for (const equipment of store.equipment) {
        await connection.query(
          `INSERT INTO equipment (
             id,
             name,
             type_id,
             cooling_capacity_kw,
             heating_capacity_kw,
             power_kw,
             voltage,
             weight,
             width,
             height,
             depth,
             efficiency,
             noise_level,
             price_estimate
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             type_id = VALUES(type_id),
             cooling_capacity_kw = VALUES(cooling_capacity_kw),
             heating_capacity_kw = VALUES(heating_capacity_kw),
             power_kw = VALUES(power_kw),
             voltage = VALUES(voltage),
             weight = VALUES(weight),
             width = VALUES(width),
             height = VALUES(height),
             depth = VALUES(depth),
             efficiency = VALUES(efficiency),
             noise_level = VALUES(noise_level),
             price_estimate = VALUES(price_estimate)`,
          [
            equipment.id,
            equipment.name,
            equipment.typeId,
            equipment.coolingCapacityKw,
            equipment.heatingCapacityKw,
            equipment.powerKw,
            equipment.voltage,
            equipment.weightKg,
            equipment.dimensions.width,
            equipment.dimensions.height,
            equipment.dimensions.depth,
            equipment.efficiency,
            equipment.noiseLevelDb,
            equipment.estimatedPrice,
          ]
        );
      }

      await connection.commit();

      return {
        equipmentTypes: store.equipmentTypes.length,
        equipment: store.equipment.length,
      };
    } catch (error) {
      await connection.rollback();
      syncPromise = undefined;
      throw error;
    } finally {
      connection.release();
    }
  })();

  return syncPromise;
}
