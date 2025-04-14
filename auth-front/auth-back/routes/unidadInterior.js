const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Obtener todas las unidades interiores
router.get("/", async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT *
      FROM unidad_interior
      WHERE model LIKE 'GMV-ND112PHS/B-T%'
         OR model IN (
            'GMV-ND12W/A-T',
            'GMV-ND18PS/C-T',
            'GMV-ND40T/C-T',
            'GMV-ND07T/C-T',
            'GMV-ND22T/C1-T',
            'GMV-ND28T/A-T',
            'GMV-ND28TS/B-T',
            'GMV-ND28TS/A-T',
            'GMV-ND22TD/A-T',
            'GMV-NC18G/B-T',
            'GMV-ND22G/B-T',
            'GMV-ND22G/C2B-T',
            'GMV-ND22G/C4B-T',
            'GMV-ND22G/D2B-T',
            'GMV-ND22G/A3A-T',
            'GMV-ND22G/A8A-T',
            'GMV-N22G/A2A-K',
            'GMV-N22G/A3A-K',
            'GMV-N22G/A4A-K',
            'GMV-N22G/B3A-K',
            'GMV-N28G/A8A-K',
            'GMV-N22G/C9A-K',
            'GMV-N22G/E3A-K'
         )
    `);

    const unidades = results.map((unidad) => ({
      ...unidad,
      image_url: unidad.image_url || null,
    }));

    res.status(200).json(unidades);
  } catch (err) {
    console.error("Error al obtener datos:", err.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;