const express = require("express");
const router = express.Router();
const db = require("../config/db"); // Importar la conexión a MySQL con Promises

// Obtener todas las unidades interiores
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM unidad_interior"); // Ejecutar la consulta con Promises
    res.status(200).json(results); // Enviar los datos al cliente
  } catch (err) {
    console.error("Error al obtener datos:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;