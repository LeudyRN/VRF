const express = require("express");
const router = express.Router();

// Ruta para obtener archivos con paginación y búsqueda
router.get("/", (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;
  const totalFiles = 30;

  // Archivos ficticios (puedes reemplazar esto con datos de tu base de datos)
  const files = Array.from({ length: totalFiles }, (_, index) => ({
    name: `Archivo_${index + 1}.docx`,
    date: `2025-03-1${index % 10}`,
  }));

  // Lógica de búsqueda
  let filteredFiles = files;
  if (search) {
    filteredFiles = files.filter((file) =>
      file.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Lógica de paginación
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  const paginatedFiles = filteredFiles.slice(start, end);

  res.json({
    files: paginatedFiles,
    total: filteredFiles.length, // Usar la longitud de los archivos filtrados
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

module.exports = router;