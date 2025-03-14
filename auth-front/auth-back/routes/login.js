const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const router = express.Router();
require("dotenv").config();

router.post("/", async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  try {
    // Obtener el usuario de la base de datos
    const [users] = await pool.query("SELECT id, nombre, usuario, contraseña_hash FROM usuarios WHERE usuario = ?", [usuario]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = users[0];

    // Verificar la contraseña usando bcrypt
    const validPassword = await bcrypt.compare(contraseña, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Verificar que JWT_SECRET está definido
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET no está configurado correctamente en las variables de entorno" });
    }

    // Generar el token JWT
    const token = jwt.sign({ id: user.id, usuario: user.usuario }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });

    // Responder con el token
    res.status(200).json({ message: "Inicio de sesión exitoso", accessToken: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
