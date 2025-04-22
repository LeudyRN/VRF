const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/Archivosrecientes", async (req, res) => {
  try {
    console.log("🧐 Datos recibidos en la API:", req.query);

    const { usuarioId, page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(400).json({ error: "❌ usuarioId no es válido o está vacío." });
    }

    const [totalProjects] = await pool.query("SELECT COUNT(*) AS total FROM proyectos WHERE usuario_id = ?", [usuarioId]);
    const totalCount = totalProjects[0]?.total || 0;

    const searchQuery = search ? `%${search}%` : "%";

    // ✅ Aquí colocamos la línea corregida para extraer solo los proyectos sin metadata
    const [proyectos] = await pool.query(`
      SELECT id, nombre, fechaCreacion
      FROM proyectos
      WHERE usuario_id = ? AND nombre LIKE ?
      ORDER BY fechaCreacion DESC
      LIMIT ? OFFSET ?;
    `, [usuarioId, searchQuery, parseInt(limit), offset]);

    console.log("✅ Proyectos obtenidos correctamente:", proyectos);

    return res.json({ proyectos, total: totalCount, page: parseInt(page), limit: parseInt(limit) });

  } catch (error) {
    console.error("❌ Error al obtener proyectos:", error);
    return res.status(500).json({ error: "Error al obtener proyectos desde la DB" });
  }
});

module.exports = router;