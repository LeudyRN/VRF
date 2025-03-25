const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const router = express.Router();

// Mensaje genérico de error
const GENERIC_ERROR_MESSAGE = "Credenciales inválidas.";

// Generar nuevo access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: String(userId) }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "35m" });
};

// Generar nuevo refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: String(userId) }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;

  // Validar entrada
  if (!refreshToken || typeof refreshToken !== "string") {
    console.warn("No se proporcionó un refreshToken válido.");
    return res.status(400).json({ error: GENERIC_ERROR_MESSAGE });
  }

  try {
    console.log("Refresh token recibido:", refreshToken);

    // Buscar usuario con ese refresh token (comparamos con bcrypt)
    const [userResult] = await pool.query(
      "SELECT id, refresh_token FROM usuarios WHERE refresh_token IS NOT NULL"
    );

    const user = userResult.find(async (u) => await bcrypt.compare(refreshToken, u.refresh_token));

    if (!user) {
      console.warn("El refreshToken no coincide con ningún usuario en la base de datos.");
      return res.status(403).json({ error: GENERIC_ERROR_MESSAGE });
    }

    // Verificar validez del refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      console.log("Refresh token decodificado correctamente:", decoded);
    } catch (error) {
      console.warn("El refreshToken proporcionado es inválido o expirado:", error.message);
      return res.status(403).json({ error: GENERIC_ERROR_MESSAGE });
    }

    // Confirmar que el ID decodificado coincide con el usuario
    if (String(user.id) !== String(decoded.id)) {
      console.warn("El ID del token no coincide con el usuario.");
      return res.status(403).json({ error: GENERIC_ERROR_MESSAGE });
    }

    // Generar nuevos tokens
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    // Guardar el nuevo refreshToken hasheado en la base de datos
    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    try {
      await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [
        hashedRefreshToken,
        user.id,
      ]);
      console.log("Tokens renovados con éxito para el usuario:", user.id);
    } catch (dbError) {
      console.error("Error al actualizar el refreshToken en la base de datos:", dbError.message);
      return res.status(500).json({ error: "Error al actualizar el token en la base de datos." });
    }

    // Enviar nuevos tokens al cliente
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Error al procesar el refresh token:", error.message);
    res.status(500).json({ error: "Error en el servidor. Inténtalo nuevamente." });
  }
});

module.exports = router;
