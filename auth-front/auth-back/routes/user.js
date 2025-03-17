const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");
const sendMail = require("../config/email");
require("dotenv").config();
const router = express.Router();
const jwt = require("jsonwebtoken");

// Confirmar correo
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

// Verificar estado del correo
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
    console.error("Error verificando el estado del correo:", error);
    res.status(500).json({ error: "Error en el servidor." });
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
