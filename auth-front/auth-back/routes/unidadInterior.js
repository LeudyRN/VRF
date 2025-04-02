const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Importa la conexión a MySQL

// Obtener todas las unidades interiores
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM unidad_interior WHERE model LIKE 'GMV-ND112PHS/B-T%' OR model = 'GMV-ND12W/A-T'");

    // No realizar conversión, devolver el valor original
    const unidades = results.map((unidad) => ({
      ...unidad,
      image_url: unidad.image_url || null, // Usar la ruta tal como está en la base de datos
    }));

    res.status(200).json(unidades); // Enviar los datos al frontend
  } catch (err) {
    console.error("Error al obtener datos:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;