const router = require("express").Router();
const db = require("../config/db"); // Asegúrate de importar la conexión a la DB

// 🔹 Obtener todos los proyectos de un usuario
router.get("/proyectos/:usuarioId", (req, res) => {
  const usuarioId = req.params.usuarioId;

  if (!usuarioId || isNaN(usuarioId)) {
    return res.status(400).json({ error: "❌ usuarioId no es válido o está vacío." });
  }

  const query = "SELECT * FROM proyectos WHERE usuario_id = ?";
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error("❌ Error en la consulta SQL:", err);
      return res.status(500).json({ error: "Error al obtener proyectos desde la DB" });
    }

    console.log("✅ Proyectos obtenidos:", results);
    res.json(results);
  });
});

// 🔹 Crear un nuevo proyecto en la base de datos
router.post("/proyectos", (req, res) => {
  const { usuarioId, nombre, data } = req.body; // Recibe el ID del usuario
  const rutaArchivo = data.rutaArchivo || "default_path"; // ✅ Asegurar que `rutaArchivo` tenga un valor
  const query = "INSERT INTO proyectos (usuario_id, nombre, data, rutaArchivo) VALUES (?, ?, ?, ?)";
  db.query(query, [usuarioId, nombre, JSON.stringify(data), rutaArchivo], (err, result) => {
    if (err) return res.status(500).json({ error: "Error al guardar el proyecto" });
    res.json({ message: "✅ Proyecto guardado exitosamente", id: result.insertId });
  });
});

module.exports = router; // ✅ Exportamos el router para que sea usado en `app.js`