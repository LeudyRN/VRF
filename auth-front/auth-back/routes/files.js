const express = require("express");
const router = express.Router(); // Cambiar a `router`

// Ruta para obtener archivos con paginación
router.get("/", (req, res) => { // Nota: Cambié "/api/files" a "/"
  const { page = 1, limit = 10 } = req.query; // Parámetros de paginación
  const totalFiles = 50; // Total de archivos (ejemplo estático)

  // Archivos ficticios (puedes reemplazar esto con datos de tu base de datos)
  const files = Array.from({ length: totalFiles }, (_, index) => ({
    name: `Archivo_${index + 1}.docx`,
    date: `2025-03-1${index % 10}`,
  }));

  // Lógica de paginación
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginatedFiles = files.slice(start, end);

  res.json({
    files: paginatedFiles,
    total: totalFiles,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

module.exports = router; // Exporta el router