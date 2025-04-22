const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

// Configuración de encriptación
const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
const ivLength = 16;

// Función para encriptar tarjeta
function encryptCardNumber(cardNumber) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cardNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

// Función para hashear CVV
async function hashCvv(cvv) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(cvv, salt);
}

// Middleware para verificar token
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso denegado. Token no proporcionado o formato incorrecto." });
  }

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch (error) {
    console.error("Error verificando token:", error.message);
    res.status(401).json({ error: "Token inválido o expirado." });
  }
};

// Validar campos de entrada
const validateFields = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) {
      return `El campo ${key} es obligatorio.`;
    }
  }
  return null;
};

// Validar datos de tarjeta
const validateCardData = (req, res, next) => {
  const validationError = validateFields(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }
  next();
};

// Procesar pagos con Azul
async function processPayment(cardNumber, expiryDate, cvv, amount) {
  try {
    const response = await axios.post(process.env.AZUL_API_URL, {
      merchantId: process.env.AZUL_MERCHANT_ID,
      merchantName: process.env.AZUL_MERCHANT_NAME,
      cardNumber,
      expiryDate,
      cvv,
      amount,
      currency: "DOP",
      transactionType: "Sale",
    });

    if (response.data && response.data.errorCode) {
      console.error("Error de Azul:", response.data.errorMessage);
      return { success: false, error: response.data.errorMessage };
    }

    return { success: true, transactionId: response.data.transactionId };
  } catch (error) {
    console.error("Error conectando con Azul:", error.message);
    return { success: false, error: "Error al conectarse con Azul." };
  }
}

// Registrar tarjeta
router.post("/register-card", verifyToken, validateCardData, async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  if (!userId || !cardNumber || !expiryDate || !cvv) {
    return res.status(400).json({ error: "Datos incompletos para registrar la tarjeta." });
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [[userResult]] = await connection.query(
      "SELECT email_verified, tarjeta_registrada FROM usuarios WHERE id = ?",
      [userId]
    );

    if (!userResult) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!userResult.email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de registrar una tarjeta." });
    }

    if (userResult.tarjeta_registrada) {
      return res.status(400).json({ error: "El usuario ya tiene una tarjeta registrada." });
    }

    const { encrypted, iv } = encryptCardNumber(cardNumber);
    const hashedCvv = await hashCvv(cvv);

    await connection.query(
      "INSERT INTO credit_cards (user_id, card_number, expiry_date, cvv, iv) VALUES (?, ?, ?, ?, ?)",
      [userId, encrypted, expiryDate, hashedCvv, iv]
    );

    await connection.query("UPDATE usuarios SET tarjeta_registrada = 1 WHERE id = ?", [userId]);

    await connection.commit();
    connection.release();
    return res.status(201).json({ message: "Tarjeta registrada exitosamente." });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error registrando tarjeta:", error.message);
    return res.status(500).json({ error: "Error interno del servidor.", details: error.message });
  }
});

module.exports = router;