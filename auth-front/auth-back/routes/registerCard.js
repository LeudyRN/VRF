const express = require("express");
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
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

router.post("/", async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  if (!userId || !cardNumber || !expiryDate || !cvv) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {

    const [result] = await pool.query("SELECT email_verified FROM usuarios WHERE id = ?", [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!result[0].email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de continuar." });
    }

    const { encrypted, iv } = encryptCardNumber(cardNumber);

    const hashedCvv = await hashCvv(cvv);

    await pool.query(
      "INSERT INTO credit_cards (user_id, card_number, expiry_date, cvv, iv) VALUES (?, ?, ?, ?, ?)",
      [userId, encrypted, expiryDate, hashedCvv, iv]
    );

    res.status(201).json({ message: "Tarjeta registrada exitosamente." });
  } catch (error) {
    console.error("Error registrando la tarjeta de crédito:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

module.exports = router;
