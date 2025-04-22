const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const sendMail = require("../config/email");
require("dotenv").config();
const router = express.Router();

// Validaciones de entrada
const validateInput = ({ nombre, apellido, usuario, correo, contraseña, genero }) => {
  if (!nombre || !apellido || !usuario || !correo || !contraseña || !genero) {
    return "Todos los campos son obligatorios.";
  }

  if (contraseña.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { // ✅ Expresión regular mejorada
    return "El formato del correo es inválido.";
  }

  if (!/^[a-zA-Z0-9_]{3,16}$/.test(usuario)) {
    return "El nombre de usuario debe tener entre 3 y 16 caracteres y solo puede incluir letras, números y guiones bajos.";
  }

  const validGenders = ["masculino", "femenino", "otro"];
  if (!validGenders.includes(genero)) {
    return "El género no es válido.";
  }

  return null;
};

// Generar enlace de confirmación
const generateConfirmationEmail = (nombre, correo, token, baseUrl) => {
  const confirmUrl = new URL(`/api/user/confirm-email`, baseUrl);
  confirmUrl.searchParams.append("token", token);

  return `
    <h1>Hola ${nombre},</h1>
    <p>Gracias por registrarte en nuestra plataforma.</p>
    <p>Por favor, confirma tu correo electrónico haciendo clic en el enlace a continuación:</p>
    <a href="${confirmUrl.href}">Confirmar correo</a>
    <p>Si el enlace no funciona, copia y pega la siguiente URL en tu navegador:</p>
    <p>${confirmUrl.href}</p>
  `;
};

// Ruta de registro
router.post("/", async (req, res) => {
  const { nombre, apellido, usuario, correo, contraseña, genero } = req.body;

  const validationError = validateInput({ nombre, apellido, usuario, correo, contraseña, genero });
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const [[existingUser]] = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = ? OR correo = ?",
      [usuario, correo]
    );

    if (existingUser) {
      return res.status(400).json({ error: "Usuario o correo ya registrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const contraseña_hash = await bcrypt.hash(contraseña, salt);
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3100";
    console.log("BACKEND_URL:", BACKEND_URL);

    const confirmUrl = new URL(`/api/user/confirm-email`, BACKEND_URL);
    confirmUrl.searchParams.append("token", token);
    console.log("Enlace de confirmación generado:", confirmUrl.href);

    const htmlContent = generateConfirmationEmail(nombre, correo, token, BACKEND_URL);

    try {
      await sendMail("gmail", correo, "Confirma tu correo electrónico", htmlContent);
      console.log("Correo de confirmación enviado.");
    } catch (error) {
      console.error("Error al enviar el correo de confirmación:", error.message);
      return res.status(500).json({ error: "Error al enviar el correo de confirmación.", details: error.message });
    }

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido, usuario, correo, contraseña_hash, genero, email_verified, token, token_expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, apellido, usuario, correo, contraseña_hash, genero, false, token, tokenExpiry]
    );

    return res.status(201).json({
      message: "Usuario registrado exitosamente. Revisa tu correo para confirmar tu cuenta.",
      userId: result.insertId,
    });

  } catch (error) {
    console.error("Error en el servidor durante el registro:", error.message);
    return res.status(500).json({ error: "Hubo un problema al registrar el usuario. Intenta nuevamente.", details: error.message });
  }
});

module.exports = router;