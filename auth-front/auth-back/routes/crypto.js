const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

const router = express.Router();

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

  // 4️⃣ Refuerzo en la validación de entrada:
  if (typeof usuario !== 'string' || !usuario.trim() || typeof contraseña !== 'string' || !contraseña.trim()) {
    return res.status(400).json({ error: "❌ Usuario y contraseña deben ser cadenas no vacías." });
  }

  try {
    // 1️⃣ Evitar recibir metadata innecesaria en la consulta SQL:
    const [users] = await pool.query(
      "SELECT id, nombre, usuario, email, contraseña_hash FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    const user = users[0];

    // 2️⃣ Mejorar la comparación de contraseñas con bcrypt.compare():
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const validPassword = await bcrypt.compare(contraseña, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // 5️⃣ Generación de JWT (Access y Refresh Tokens):
    const accessToken = generateAccessToken(user.id, user.usuario);
    const refreshToken = generateRefreshToken(user.id, user.usuario);

    // Guardar el Refresh Token en la base de datos (opcional, dependiendo de tu estrategia)
    await pool.query("UPDATE usuarios SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      refreshToken,
      userId: user.id,
      nombre: user.nombre, // Puedes incluir más información del usuario si lo necesitas
      email: user.email,
    });
  } catch (error) {
    // 3️⃣ Manejo de errores más detallado:
    console.error("❌ Error al procesar el inicio de sesión:", error.message, error.stack);
    res.status(500).json({ error: `❌ Hubo un problema en el servidor: ${error.message}. Inténtalo nuevamente.` });
  }
});

module.exports = router;