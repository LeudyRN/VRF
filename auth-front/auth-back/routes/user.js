const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendMail = require("../config/email");
require("dotenv").config();
const router = express.Router();

// Configuración de encriptación
const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const ivLength = 16;

// Función para encriptar número de tarjeta
function encryptCardNumber(cardNumber) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cardNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

// Función para hashear el CVV
async function hashCvv(cvv) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(cvv, salt);
}

// Middleware de validación de tokens
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado o formato incorrecto." });
  }

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error("Error verificando token:", error.message);
    res.status(401).json({ error: "Token inválido o expirado." });
  }
};

// Validar datos de entrada para tarjeta
const validateCardData = (req, res, next) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;
  if (!userId || !cardNumber || !expiryDate || !cvv) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
    return res.status(400).json({ error: "Fecha de expiración inválida (formato MM/YY)." });
  }
  if (!/^[0-9]{3,4}$/.test(cvv)) {
    return res.status(400).json({ error: "CVV inválido." });
  }
  if (!/^[0-9]{13,19}$/.test(cardNumber)) {
    return res.status(400).json({ error: "Número de tarjeta inválido." });
  }
  next();
};

// Registro de tarjeta
router.post("/register-card", verifyToken, validateCardData, async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  try {
    const [userResult] = await pool.query(
      "SELECT email_verified, tarjeta_registrada FROM usuarios WHERE id = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!userResult[0].email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de registrar una tarjeta." });
    }

    if (userResult[0].tarjeta_registrada) {
      return res.status(400).json({ error: "El usuario ya tiene una tarjeta registrada." });
    }

    const { encrypted, iv } = encryptCardNumber(cardNumber);
    const hashedCvv = await hashCvv(cvv);

    await pool.query(
      "INSERT INTO credit_cards (user_id, card_number, expiry_date, cvv, iv) VALUES (?, ?, ?, ?, ?)",
      [userId, encrypted, expiryDate, hashedCvv, iv]
    );

    await pool.query("UPDATE usuarios SET tarjeta_registrada = 1 WHERE id = ?", [userId]);

    res.status(201).json({ message: "Tarjeta registrada exitosamente." });
  } catch (error) {
    console.error("Error registrando tarjeta:", error.message);
    res.status(500).json({ error: "Hubo un problema al registrar la tarjeta." });
  }
});

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Token no proporcionado.");
  }

  try {
      const [user] = await pool.query("SELECT id FROM usuarios WHERE token = ?", [token]);

      if (!user || user.length === 0) {
          return res.redirect("http://localhost:5173/email-confirmation-failed");
      }

      const refreshToken = jwt.sign(
          { id: user[0].id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
      );

      await pool.query("UPDATE usuarios SET email_verified = true, token = NULL, refresh_token = ? WHERE id = ?",
          [refreshToken, user[0].id]
      );

      return res.redirect("http://localhost:5173/email-confirmation-success");
  } catch (error) {
      console.error("Error al confirmar el correo:", error);
      return res.redirect("http://localhost:5173/email-confirmation-failed");
  }
});

router.get("/status", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "El ID de usuario es requerido." });
  }

  try {
    const [result] = await pool.query("SELECT email_verified FROM usuarios WHERE id = ?", [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ email_verified: result[0].email_verified });
  } catch (error) {
    console.error("Error verificando el estado del correo:", error.message);
    res.status(500).json({ error: "Error interno del servidor. Inténtalo nuevamente más tarde." });
  }
});
// Reenviar correo de confirmación
router.post("/resend-confirmation", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "El ID de usuario es requerido." });
  }

  try {
    const [user] = await pool.query("SELECT correo, email_verified FROM usuarios WHERE id = ?", [userId]);

    if (user.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user[0].email_verified) {
      return res.status(400).json({ error: "El correo ya ha sido confirmado." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE usuarios SET token = ? WHERE id = ?", [token, userId]);

    const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3100";
    const confirmUrl = `${BACKEND_URL}/api/user/confirm-email?token=${token}`;

    const htmlContent = `
    <h1>Confirma tu correo</h1>
    <p>Haz clic en el siguiente enlace para confirmar tu correo:</p>
    <a href="${confirmUrl}">Confirmar correo</a>
  `;

  await sendMail("gmail", user[0].correo, "Confirma tu correo electrónico", htmlContent);

 res.json({ message: "Correo de confirmación reenviado exitosamente." });
} catch (error) {
  console.error("Error al reenviar el correo:", error);
  res.status(500).json({ error: "Error en el servidor." });
}

});

module.exports = router;