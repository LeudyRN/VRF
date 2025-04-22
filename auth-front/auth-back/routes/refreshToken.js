const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const router = express.Router();
const cookieParser = require("cookie-parser");


// Mensaje genérico de error
const GENERIC_ERROR_MESSAGE = "Credenciales inválidas.";

// Generar nuevo access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: String(userId) }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "35m" });
};

// Generar nuevo refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: String(userId) }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "35m" });
};

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken || typeof refreshToken !== "string") {
    console.warn("⚠️ No se proporcionó un refreshToken válido.");
    return res.status(400).json({ error: "Error: Refresh token inválido." });
  }

  try {
    console.log("🚀 Refresh token recibido:", refreshToken);

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      console.log("✅ Refresh token decodificado correctamente:", decoded);
    } catch (error) {
      console.warn("❌ Refresh token inválido o expirado:", error.message);

      // 🔥 Invalidar el refresh token en caso de expiración
      await pool.query("UPDATE usuarios SET refresh_token = NULL WHERE refresh_token = ?", [refreshToken]);

      return res.status(403).json({ error: "Sesión expirada, inicia sesión nuevamente." });
    }

    // 🔹 Obtener el usuario por ID
    const [[validUser]] = await pool.query("SELECT id, refresh_token FROM usuarios WHERE id = ?", [decoded.id]);

    if (!validUser || !validUser.refresh_token) {
      console.warn("❌ Usuario no encontrado o sin refresh token. Invalidando sesión...");

      // 🔥 Invalidar el token en la base de datos en caso de inconsistencia
      await pool.query("UPDATE usuarios SET refresh_token = NULL WHERE id = ?", [decoded.id]);

      return res.status(401).json({ error: "Sesión expirada, por favor inicia sesión nuevamente." });
    }

    // 🔹 Validar si el token coincide con el registrado en la BD
    if (refreshToken !== validUser.refresh_token) {
      console.warn("❌ El refresh token no coincide con el almacenado. Invalidando sesión...");

      // 🔥 Invalidar el token incorrecto
      await pool.query("UPDATE usuarios SET refresh_token = NULL WHERE id = ?", [decoded.id]);

      return res.status(401).json({ error: "Sesión expirada, por favor inicia sesión nuevamente." });
    }

    // 🔥 Generar nuevos tokens
    const newAccessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    // 🔥 Reemplazar el refreshToken viejo por el nuevo correctamente
    await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [newRefreshToken, decoded.id]);
    console.log("✅ Tokens renovados con éxito para el usuario:", decoded.id);

    // 🔹 Enviar respuesta con ambos tokens renovados
    res.json({
      message: "✅ Tokens renovados correctamente.",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken, // 🔥 Aseguramos que el nuevo refreshToken se envíe correctamente
    });
  } catch (error) {
    console.error("❌ Error al procesar el refresh token:", error.message);
    res.status(500).json({ error: "Error en el servidor. Inténtalo nuevamente." });
  }
});

module.exports = router;