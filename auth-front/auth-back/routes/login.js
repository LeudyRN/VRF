const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();
require("dotenv").config();

// Mensajes de error genéricos
const GENERIC_ERROR_MESSAGE = "Usuario o contraseña incorrectos.";

// Generar Access Token
const generateAccessToken = (userId, usuario) => {
  return jwt.sign({ id: userId, usuario }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m", // Duración de 15 minutos
  });
};

// Generar Refresh Token
const generateRefreshToken = (userId, usuario) => {
  return jwt.sign({ id: userId, usuario }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "15m", // Duración de 7 días
  });
};

router.post("/", async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  try {
    // Buscar al usuario en la base de datos
    const [users] = await pool.query(
      "SELECT id, nombre, usuario, contraseña_hash, tarjeta_registrada FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    const user = users[0];

    // Comparar la contraseña con el hash almacenado
    const validPassword = await bcrypt.compare(contraseña, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    // ✅ Generar nuevos tokens
    const accessToken = generateAccessToken(user.id, user.usuario);
    const refreshToken = generateRefreshToken(user.id, user.usuario);

    // ✅ Guardar el refreshToken en la base de datos
    await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

    console.log("✅ RefreshToken actualizado correctamente en la base de datos.");

    // 🔥 Almacenar el `refreshToken` en `httpOnly` cookies para mayor seguridad
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // Expira en 7 días
    });

    // 🔹 **Enviar `refreshToken` junto con `accessToken` en la respuesta JSON**
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      accessToken,
      refreshToken, // 🔥 **Antes faltaba esta línea, ahora el frontend lo recibirá correctamente.**
      redirectToRegisterCard: !user.tarjeta_registrada,
    });
  } catch (error) {
    console.error("❌ Error al iniciar sesión:", error.message);
    res.status(500).json({ error: "Error en el servidor. Inténtalo nuevamente." });
  }
});

module.exports = router;