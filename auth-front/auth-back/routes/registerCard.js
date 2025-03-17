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

router.get("/", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "El ID del usuario es requerido." });
  }

  try {
    // Verifica si el usuario tiene una tarjeta registrada
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM credit_cards WHERE user_id = ?",
      [userId]
    );

    if (result[0].count > 0) {
      return res.status(200).json({ tarjetaRegistrada: true });
    }

    res.status(200).json({ tarjetaRegistrada: false });
  } catch (error) {
    console.error("Error verificando el estado de la tarjeta:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

router.post("/", async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  if (!userId || !cardNumber || !expiryDate || !cvv) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    // Verifica si el usuario existe
    const [result] = await pool.query("SELECT email_verified FROM usuarios WHERE id = ?", [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!result[0].email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de continuar." });
    }

    // Verificar y validar expiryDate (YYYY-MM-DD)
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

    res.status(201).json({ message: "Tarjeta registrada exitosamente." });
  } catch (error) {
    console.error("Error registrando la tarjeta de crédito:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
});

module.exports = router;
