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
    if (!modelosPermitidos.length) {
      return res.status(400).json({ error: "❌ No hay modelos válidos para la consulta." });
    }

    const query = `
      SELECT * FROM unidad_interior
      WHERE model LIKE 'GMV-ND112PHS/B-T%'
         OR model IN (${modelosPermitidos.map(() => "?").join(", ")})
      LIMIT 50;
    `;

    const [results] = await db.query(query, modelosPermitidos);

    const unidades = results.map((unidad) => ({
      ...unidad,
      image_url: unidad.image_url ?? null,
    }));

    console.log("✅ Unidades interiores obtenidas correctamente:", unidades.length);
    res.status(200).json(unidades);

  } catch (err) {
    console.error("❌ Error al obtener unidades interiores:", err.message, err.stack);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// 🔹 Obtener modelos relacionados con un `unitName` específico
router.get("/relacionados/:unitName", async (req, res) => {
  try {
    const { unitName } = req.params;

    if (!unitName || typeof unitName !== "string" || unitName.trim() === "") {
      return res.status(400).json({ error: "❌ unitName debe ser una cadena válida y no estar vacío." });
    }

    const [results] = await db.query(
      "SELECT * FROM unidad_interior WHERE unitName = ? LIMIT 50",
      [unitName]
    );

    console.log("✅ Modelos relacionados encontrados:", results.length);
    res.status(200).json(results);

  } catch (err) {
    console.error("❌ Error al obtener modelos relacionados:", err.message, err.stack);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

router.post("/guardar-proyecto", async (req, res) => {
  try {
    console.log("📡 Datos recibidos en guardar-proyecto:", req.body);

    // 🔹 Extraemos los valores desde el frontend
    const { id, nombre, usuario_id, fechaCreacion, rutaArchivo, unidadesInterior } = req.body;

    // 🔹 Validamos que no falten valores obligatorios
    if (!id || !nombre || !usuario_id || !fechaCreacion || !rutaArchivo || !Array.isArray(unidadesInterior) || unidadesInterior.length === 0) {
      return res.status(400).json({ error: "❌ Datos incompletos o incorrectos para guardar el proyecto." });
    }

    // 🔹 Obtener el proyecto actual desde la base de datos
    const queryGetProyecto = "SELECT data FROM proyectos WHERE id = ?";
    const [proyecto] = await db.query(queryGetProyecto, [id]);

    // 🔹 Asegurar que `data` es un JSON válido antes de modificarlo
    const dataActual = typeof proyecto[0].data === "string" ? JSON.parse(proyecto[0].data) : proyecto[0].data ?? {};

    // 🔹 Asegurar que `unidadesInterior` existe dentro de `data`
    if (!Array.isArray(dataActual.unidadesInterior)) {
      dataActual.unidadesInterior = []; // 🔹 Si no existe, inicializarlo como un array vacío
    }

    // 🔹 Fusionar los nuevos equipos interiores con los existentes dentro de `data.unidadesInterior`
    dataActual.unidadesInterior = [...dataActual.unidadesInterior, ...unidadesInterior];

    // 🔹 Guardar `data` actualizado en la base de datos
    const queryUpdateProyecto = `
      UPDATE proyectos
      SET data = ?
      WHERE id = ?;
    `;
    await db.query(queryUpdateProyecto, [JSON.stringify(dataActual), id]);

    console.log("✅ Proyecto actualizado correctamente en la base de datos");
    res.status(200).json({ message: "Proyecto actualizado con éxito." });

  } catch (error) {
    console.error("❌ Error al actualizar el proyecto:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;