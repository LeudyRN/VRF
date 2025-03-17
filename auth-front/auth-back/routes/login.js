const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const CryptoJS = require("crypto-js");
const router = express.Router();
require("dotenv").config();

// login.js (backend)

router.post("/", async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  try {
    // Buscar al usuario en la base de datos
    const [users] = await pool.query(
      "SELECT id, nombre, usuario, contraseña_hash, tarjeta_registrada FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = users[0];

    // Descifrar la contraseña recibida del frontend
    const decryptedPassword = CryptoJS.AES.decrypt(
      contraseña,
      "clave_secreta"
    ).toString(CryptoJS.enc.Utf8);

    // Verificar la contraseña descifrada
    const validPassword = await bcrypt.compare(decryptedPassword, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar Access Token
    const accessToken = jwt.sign(
      { id: user.id, usuario: user.usuario },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "2m" }
    );

    // Generar Refresh Token
    const refreshToken = jwt.sign(
      { id: user.id, usuario: user.usuario },
      process.env.REFRESH_TOKEN_SECRET
    );

    // Guardar el Refresh Token en la base de datos
    await pool.query(
      "UPDATE usuarios SET refresh_token = ? WHERE id = ?",
      [refreshToken, user.id]
    );

    // Verificar si tiene tarjeta registrada
    if (!user.tarjeta_registrada) {
      return res.status(200).json({
        message: "Usuario autenticado, pero necesita registrar tarjeta.",
        accessToken,
        refreshToken,
        redirectToRegisterCard: true, // Indicador para redirigir al registro de tarjeta
      });
    }

    // Si ya tiene tarjeta registrada
    res.status(200).json({
      message: "Inicio de sesión exitoso",
      accessToken,
      refreshToken,
      redirectToRegisterCard: false, // No necesita redirección
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
