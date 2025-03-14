const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const router = express.Router();

router.post("/", async (req, res) => {
  const { nombre, apellido, usuario, correo, contraseña, genero } = req.body;

  if (!nombre || !apellido || !usuario || !correo || !contraseña || !genero) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const [existingUser] = await pool.query("SELECT id FROM usuarios WHERE usuario = ? OR correo = ?", [usuario, correo]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Usuario o correo ya registrado" });
    }

    const salt = await bcrypt.genSalt(10);
    const contraseña_hash = await bcrypt.hash(contraseña, salt);

    await pool.query("INSERT INTO usuarios (nombre, apellido, usuario, correo, contraseña_hash, genero) VALUES (?, ?, ?, ?, ?, ?)",
    [nombre, apellido, usuario, correo, contraseña_hash, genero]);

    res.status(201).json({ message: "Usuario registrado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;
