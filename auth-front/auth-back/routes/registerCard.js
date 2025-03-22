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

// Función para encriptar el número de tarjeta
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

// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado o formato incorrecto." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    console.error("Error verificando el token:", error.message);
    res.status(401).json({ error: "Token inválido o expirado." });
  }
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

    if (response.data.errorCode) {
      console.error("Error de Azul:", response.data.errorMessage);
      return { success: false, error: response.data.errorMessage };
    }

    return { success: true, transactionId: response.data.transactionId };
  } catch (error) {
    console.error("Error conectando con Azul:", error.message);
    return { success: false, error: "Error al conectarse con Azul." };
  }
}

// Validar datos de tarjeta
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

// Ruta para procesar pagos
router.post("/processPayment", verifyToken, validateCardData, async (req, res) => {
  const { cardNumber, expiryDate, cvv, amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "El monto es obligatorio y debe ser mayor a 0." });
  }

  try {
    const paymentResponse = await processPayment(cardNumber, expiryDate, cvv, amount);

    if (!paymentResponse.success) {
      return res.status(400).json({ error: paymentResponse.error });
    }

    res.status(200).json({ message: "Pago aprobado.", transactionId: paymentResponse.transactionId });
  } catch (error) {
    console.error("Error procesando el pago:", error.message);
    res.status(500).json({ error: "Error interno al procesar el pago." });
  }
});

// Ruta para registrar tarjeta
router.post("/", verifyToken, validateCardData, async (req, res) => {
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

    if (userResult[0].tarjeta_registrada === 1) {
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
    console.error("Error registrando la tarjeta:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;