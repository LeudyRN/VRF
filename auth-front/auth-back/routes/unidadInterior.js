const express = require("express");
const router = express.Router();
const db = require("../config/db");

// 🔹 Lista de modelos que deben ser filtrados en la consulta
const modelosPermitidos = [
  "GMV-ND12W/A-T", "GMV-ND18PS/C-T", "GMV-ND40T/C-T", "GMV-ND07T/C-T",
  "GMV-ND22T/C1-T", "GMV-ND28T/A-T", "GMV-ND28TS/B-T", "GMV-ND28TS/A-T",
  "GMV-ND22TD/A-T", "GMV-NC18G/B-T", "GMV-ND22G/B-T", "GMV-ND22G/C2B-T",
  "GMV-ND22G/C4B-T", "GMV-ND22G/D2B-T", "GMV-ND22G/A3A-T", "GMV-ND22G/A8A-T",
  "GMV-N22G/A2A-K", "GMV-N22G/A3A-K", "GMV-N22G/A4A-K", "GMV-N22G/B3A-K",
  "GMV-N28G/A8A-K", "GMV-N22G/C9A-K", "GMV-N22G/E3A-K"
];

// 🔹 Obtener todas las unidades interiores con filtros de modelos
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT * FROM unidad_interior
      WHERE model LIKE 'GMV-ND112PHS/B-T%'
         OR model IN (${modelosPermitidos.map(() => "?").join(", ")})
    `;

    const [results] = await db.query(query, modelosPermitidos);

    // 🔹 Mapear resultados para asegurar que `image_url` siempre tenga un valor válido
    const unidades = results.map((unidad) => ({
      ...unidad,
      image_url: unidad.image_url || null,
    }));

    console.log("✅ Unidades interiores obtenidas correctamente:", unidades.length);
    res.status(200).json(unidades);
  } catch (err) {
    console.error("❌ Error al obtener unidades interiores:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// 🔹 Obtener modelos relacionados con un `unitName` específico
router.get("/relacionados/:unitName", async (req, res) => {
  try {
    const { unitName } = req.params;

    if (!unitName) {
      return res.status(400).json({ error: "❌ unitName es requerido." });
    }

    const [results] = await db.query(
      "SELECT * FROM unidad_interior WHERE unitName = ?",
      [unitName]
    );

    console.log("✅ Modelos relacionados encontrados:", results.length);
    res.status(200).json(results);
  } catch (err) {
    console.error("❌ Error al obtener modelos relacionados:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;