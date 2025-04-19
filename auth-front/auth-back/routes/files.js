const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/Archivosrecientes", async (req, res) => {
  const { usuarioId, page = 1, limit = 10, search = "" } = req.query;
  const offset = (page - 1) * limit;

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: "❌ usuarioId no es válido o está vacío." });
  }

  try {
    const [totalCount] = await pool.query(
      "SELECT COUNT(*) AS total FROM proyectos WHERE usuario_id = ?",
      [usuarioId]
    );
    const totalProjects = totalCount[0]?.total || 0;

    const searchQuery = search ? `%${search}%` : "%";
    const query = `
      SELECT id, nombre, fechaCreacion
      FROM proyectos
      WHERE usuario_id = ? AND nombre LIKE ?
      ORDER BY fechaCreacion DESC
      LIMIT ? OFFSET ?;
    `;

    const [proyectos] = await pool.query(query, [usuarioId, searchQuery, parseInt(limit), offset]);

    res.json({
      proyectos: proyectos.length > 0 ? proyectos : [],
      total: totalProjects,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("❌ Error al obtener proyectos:", error);
    res.status(500).json({ error: "Error al obtener proyectos desde la DB" });
  }
});

module.exports = router;