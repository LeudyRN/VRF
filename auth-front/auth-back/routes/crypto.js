const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
require("dotenv").config();

const router = express.Router();

router.post("/", async (req, res) => {
  const { usuario, contraseña } = req.body;

  // Validación inicial de los campos
  if (!usuario || !contraseña) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  try {
    // Buscar el usuario en la base de datos
    const [users] = await pool.query(
      "SELECT id, nombre, usuario, contraseña_hash FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    const user = users[0];

    // Comparar la contraseña con el hash almacenado
    const validPassword = await bcrypt.compare(contraseña, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas." });
    }

    // Si la autenticación es exitosa, genera y devuelve los tokens
    // Aquí podrías generar JWT o cualquier otro token necesario
    res.status(200).json({ message: "Inicio de sesión exitoso", userId: user.id });
  } catch (error) {
    console.error("Error al procesar el inicio de sesión:", error.message);
    res.status(500).json({ error: "Hubo un problema en el servidor. Inténtalo nuevamente." });
  }
});

module.exports = router;
