const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();

// Mensaje genérico de error
const GENERIC_ERROR_MESSAGE = "Credenciales inválidas.";

// Generar nuevo access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "35m" });
};

// Generar nuevo refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;

  // Validar entrada
  if (!refreshToken || typeof refreshToken !== "string") {
    return res.status(400).json({ error: GENERIC_ERROR_MESSAGE });
  }

  try {
    // Verificar que el refresh token esté en la base de datos
    const [userResult] = await pool.query(
      "SELECT id, refresh_token FROM usuarios WHERE refresh_token = ?",
      [refreshToken]
    );

    if (userResult.length === 0) {
      return res.status(403).json({ error: GENERIC_ERROR_MESSAGE });
    }

    const user = userResult[0];

    // Verificar la validez del refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return res.status(403).json({ error: GENERIC_ERROR_MESSAGE });
    }

    // Generar nuevos tokens
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    // Actualizar el refresh token en la base de datos
    await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [
      newRefreshToken,
      user.id,
    ]);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Error al procesar el refresh token:", error.message);
    res.status(500).json({ error: "Error en el servidor. Inténtalo nuevamente." });
  }
});

module.exports = router;