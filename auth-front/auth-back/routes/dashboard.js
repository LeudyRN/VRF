const router = require("express").Router();
const db = require("../config/db"); // Asegúrate de importar la conexión a la DB

// 🔹 Obtener todos los proyectos de un usuario
router.get("/proyectos/:usuarioId", async (req, res) => {
  try {
    console.log("🧐 Datos recibidos en la API:", req.params);

    const { usuarioId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!usuarioId || isNaN(usuarioId)) {
      return res.status(400).json({ error: "❌ usuarioId no es válido o está vacío." });
    }

    const [[totalCount]] = await db.query("SELECT COUNT(*) AS total FROM proyectos WHERE usuario_id = ?", [usuarioId]);
    const totalProjects = totalCount?.total || 0;

    const [proyectos] = await db.query(`
      SELECT id, nombre, fechaCreacion
      FROM proyectos
      WHERE usuario_id = ?
      ORDER BY fechaCreacion DESC
      LIMIT ? OFFSET ?;
    `, [usuarioId, parseInt(limit), parseInt(offset)]);

    console.log("✅ Proyectos obtenidos correctamente:", proyectos);

    return res.json({ proyectos, total: totalProjects, page: parseInt(page), limit: parseInt(limit) });

  } catch (error) {
    console.error("❌ Error al obtener proyectos:", error);
    return res.status(500).json({ error: "Error al obtener proyectos desde la DB" });
  }
});

// 🔹 Crear un nuevo proyecto en la base de datos
router.post("/crearProyectos", async (req, res) => {
  try {
    console.log("🧐 Datos recibidos en la API:", req.body);

    const { usuarioId, nombre, data = {} } = req.body;
    const rutaArchivo = data.rutaArchivo || "default_path";

    if (!usuarioId || !nombre) {
      console.warn("⚠️ Datos faltantes en la solicitud.");
      return res.status(400).json({ error: "❌ Datos incompletos." });
    }

    const query = "INSERT INTO proyectos (usuario_id, nombre, data, rutaArchivo) VALUES (?, ?, ?, ?)";
    const [result] = await db.query(query, [usuarioId, nombre, JSON.stringify(data), rutaArchivo]);

    console.log("✅ Proyecto guardado en la DB:", result);

    return res.json({
      id: result.insertId,
      usuarioId,
      nombre,
      data,
      rutaArchivo,
      fechaCreacion: new Date().toISOString(),
      message: "✅ Proyecto guardado exitosamente",
    });

  } catch (error) {
    console.error("❌ Error al guardar el proyecto:", error);
    return res.status(500).json({ error: "❌ Error al guardar el proyecto" });
  }
});

// 🔹 Eliminar un proyecto de la base de datos
router.delete("/proyectos/:proyectoId", async (req, res) => {
  try {
    const { proyectoId } = req.params;

    console.log(`🧐 Intentando eliminar el proyecto ID: ${proyectoId}`);

    if (!proyectoId || isNaN(proyectoId)) {
      console.error("❌ Error: proyectoId no es válido.");
      return res.status(400).json({ error: "❌ proyectoId no válido." });
    }

    const [[existCheck]] = await db.query("SELECT * FROM proyectos WHERE id = ?", [proyectoId]);

    if (!existCheck) {
      console.warn(`⚠️ Proyecto ID ${proyectoId} no encontrado.`);
      return res.status(404).json({ error: "❌ Proyecto no encontrado." });
    }

    const [deleteResult] = await db.query("DELETE FROM proyectos WHERE id = ?", [proyectoId]);

    console.log(`🧐 Filas afectadas en eliminación: ${deleteResult.affectedRows}`);

    if (deleteResult.affectedRows === 0) {
      return res.status(500).json({ error: "❌ No se pudo eliminar el proyecto." });
    }

    console.log(`✅ Proyecto ID ${proyectoId} eliminado correctamente.`);
    return res.status(200).json({ message: "✅ Proyecto eliminado con éxito." });

  } catch (error) {
    console.error("❌ Error al eliminar el proyecto:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;