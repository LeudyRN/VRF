import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const libraryPath = path.resolve(__dirname, "../../../data/equipmentLibrary/genericEquipment.json");
const data = JSON.parse(fs.readFileSync(libraryPath, "utf8"));

export const store = {
  equipmentTypes: data.equipmentTypes,
  equipment: data.equipment,
  projects: [],
  placements: [],
  connections: [],
};
