import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { ensureEquipmentCatalog } from "./database/syncEquipmentCatalog.js";

const app = createApp();

try {
  const catalogSummary = await ensureEquipmentCatalog();
  console.log(
    `Equipment catalog synchronized: ${catalogSummary.equipmentTypes} types, ${catalogSummary.equipment} items`
  );
} catch (error) {
  console.error("Failed to synchronize equipment catalog", error);
  process.exit(1);
}

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`);
});
