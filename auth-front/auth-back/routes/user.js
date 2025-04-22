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
    console.error("Error verificando token:", error.message, error.stack); // 3️⃣ Manejo de errores detallado
    res.status(401).json({ error: `Token inválido o expirado: ${error.message}` }); // 3️⃣ Manejo de errores detallado
  }
};

// Validar datos de entrada para tarjeta
const validateCardData = (req, res, next) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;
  // 4️⃣ Refuerzo en la validación de entrada: Verificar que sean strings y no vacíos
  if (typeof userId !== 'number' || isNaN(userId) || typeof cardNumber !== 'string' || !cardNumber.trim() || typeof expiryDate !== 'string' || !expiryDate.trim() || typeof cvv !== 'string' || !cvv.trim()) {
    return res.status(400).json({ error: "❌ Todos los campos son obligatorios y deben ser válidos." });
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
    return res.status(400).json({ error: "❌ Fecha de expiración inválida (formato MM/YY)." });
  }
  if (!/^[0-9]{3,4}$/.test(cvv)) {
    return res.status(400).json({ error: "❌ CVV inválido." });
  }
  if (!/^[0-9]{13,19}$/.test(cardNumber)) {
    return res.status(400).json({ error: "❌ Número de tarjeta inválido." });
  }
  next();
};

// Registro de tarjeta
router.post("/register-card", verifyToken, validateCardData, async (req, res) => {
  const { userId, cardNumber, expiryDate, cvv } = req.body;

  try {
    // 1️⃣ Evitar recibir metadata innecesaria en la consulta SQL:
    const [userResult] = await pool.query(
      "SELECT email_verified, tarjeta_registrada FROM usuarios WHERE id = ?",
      [userId]
    );

    const user = userResult[0]; // 1️⃣ Obtener los datos directamente

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: "Debes confirmar tu correo antes de registrar una tarjeta." });
    }

    if (user.tarjeta_registrada) {
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
    // 3️⃣ Manejo de errores más detallado:
    console.error("Error registrando tarjeta:", error.message, error.stack);
    res.status(500).json({ error: `Hubo un problema al registrar la tarjeta: ${error.message}` });
  }
});

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;

  // 4️⃣ Refuerzo en la validación de entrada:
  if (typeof token !== 'string' || !token.trim()) {
    return res.status(400).send("❌ Token no proporcionado o inválido.");
  }

  try {
    // 1️⃣ Evitar recibir metadata innecesaria en la consulta SQL:
    const [users] = await pool.query("SELECT id FROM usuarios WHERE token = ?", [token]);
    const user = users[0]; // 1️⃣ Obtener los datos directamente

    if (!user) {
      return res.redirect("http://localhost:5173/email-confirmation-failed");
    }

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    await pool.query("UPDATE usuarios SET email_verified = true, token = NULL, refresh_token = ? WHERE id = ?",
      [refreshToken, user.id]
    );

    return res.redirect("http://localhost:5173/email-confirmation-success");
  } catch (error) {
    // 3️⃣ Manejo de errores más detallado:
    console.error("Error al confirmar el correo:", error.message, error.stack);
    return res.redirect(`http://localhost:5173/email-confirmation-failed?error=${encodeURIComponent(error.message)}`); // Incluir mensaje de error en la redirección
  }
});

router.get("/status", async (req, res) => {
  const { userId } = req.query;

  // 4️⃣ Refuerzo en la validación de entrada:
  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ error: "❌ El ID de usuario es requerido y debe ser un número." });
  }

  try {
    // 1️⃣ Evitar recibir metadata innecesaria en la consulta SQL:
    const [results] = await pool.query("SELECT email_verified FROM usuarios WHERE id = ?", [userId]);
    const result = results[0]; // 1️⃣ Obtener los datos directamente

    if (!result) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json({ email_verified: result.email_verified });
  } catch (error) {
    // 3️⃣ Manejo de errores más detallado:
    console.error("Error verificando el estado del correo:", error.message, error.stack);
    res.status(500).json({ error: `Error interno del servidor: ${error.message}. Inténtalo nuevamente más tarde.` });
  }
});

// Reenviar correo de confirmación
router.post("/resend-confirmation", async (req, res) => {
  const { userId } = req.body;

  // 4️⃣ Refuerzo en la validación de entrada:
  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ error: "❌ El ID de usuario es requerido y debe ser un número." });
  }

  try {
    // 1️⃣ Evitar recibir metadata innecesaria en la consulta SQL:
    const [users] = await pool.query("SELECT correo, email_verified FROM usuarios WHERE id = ?", [userId]);
    const user = users[0]; // 1️⃣ Obtener los datos directamente

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user.email_verified) {
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

    await sendMail("gmail", user.correo, "Confirma tu correo electrónico", htmlContent);

    res.json({ message: "Correo de confirmación reenviado exitosamente." });
  } catch (error) {
    // 3️⃣ Manejo de errores más detallado:
    console.error("Error al reenviar el correo:", error.message, error.stack);
    res.status(500).json({ error: `Error en el servidor: ${error.message}` });
  }
});

module.exports = router;