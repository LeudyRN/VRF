const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const router = express.Router();

const algorithm = "aes-256-cbc";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encryptCardNumber(cardNumber) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cardNumber, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encrypted, iv: iv.toString("hex") };
}

async function hashCvv(cvv) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(cvv, salt);
}

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Acceso denegado" });
  }

  try {
    const verified = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: "Token inválido" });
  }
};

router.get("/", verifyToken, async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "El usuario no está autenticado. Por favor, inicie sesión." });
  }

  try {
    // Verificar si el usuario existe
    const [userResult] = await pool.query("SELECT id, tarjeta_registrada FROM usuarios WHERE id = ?", [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado en el sistema." });
    }

    // Verificar si el usuario tiene tarjeta registrada
    const tieneTarjeta = userResult[0].tarjeta_registrada === 1;

    return res.status(200).json({ tarjetaRegistrada: tieneTarjeta });
  } catch (error) {
    console.error("Error verificando al usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

router.post("/", verifyToken, async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  if (!userId || !cardNumber || !expiryDate || !cvv) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    // Verifica si el usuario existe y su estado de correo
    const [userResult] = await pool.query("SELECT email_verified, tarjeta_registrada FROM usuarios WHERE id = ?", [userId]);

    if (userResult.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!userResult[0].email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de continuar." });
    }

    if (userResult[0].tarjeta_registrada === 1) {
      return res.status(400).json({ error: "El usuario ya tiene una tarjeta registrada." });
    }

    // Valida la fecha de expiración
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      return res.status(400).json({ error: "El formato de la fecha de expiración es inválido." });
    }

    // Cifrar el número de tarjeta
    const { encrypted, iv } = encryptCardNumber(cardNumber);

    // Hashear el CVV
    const hashedCvv = await hashCvv(cvv);

    // Guardar los datos de la tarjeta en la base de datos
    await pool.query(
      "INSERT INTO credit_cards (user_id, card_number, expiry_date, cvv, iv) VALUES (?, ?, ?, ?, ?)",
      [userId, encrypted, expiryDate, hashedCvv, iv]
    );

    // Actualizar el estado de `tarjeta_registrada` del usuario
    await pool.query(
      "UPDATE usuarios SET tarjeta_registrada = 1 WHERE id = ?",
      [userId]
    );

    res.status(201).json({ message: "Tarjeta registrada exitosamente." });
  } catch (error) {
    console.error("Error registrando la tarjeta de crédito:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
