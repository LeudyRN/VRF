const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({ error: "Token de refresco inválido o ausente" });
  }

  try {
    // Verifica que el refresh token esté en la base de datos
    const [user] = await pool.query("SELECT id FROM usuarios WHERE refresh_token = ?", [refreshToken]);

    if (user.length === 0) {
      return res.status(403).json({ error: "Refresh token no válido o no registrado" });
    }

    // Verifica la validez del token de forma sincrónica
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.status(403).json({ error: "Refresh token expirado o inválido" });
    }

    // Genera un nuevo accessToken
    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    // Opcional: Generar y actualizar un nuevo refreshToken
    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [newRefreshToken, decoded.id]);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Error al refrescar token:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
