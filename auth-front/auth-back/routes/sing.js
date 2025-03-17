const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");
const sendMail = require("../config/email");
require("dotenv").config();
const router = express.Router();

router.post("/", async (req, res) => {
    const { nombre, apellido, usuario, correo, contraseña, genero } = req.body;

    if (!nombre || !apellido || !usuario || !correo || !contraseña || !genero) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    try {
        const [existingUser] = await pool.query(
            "SELECT id FROM usuarios WHERE usuario = ? OR correo = ?",
            [usuario, correo]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: "Usuario o correo ya registrado." });
        }

        const salt = await bcrypt.genSalt(10);
        const contraseña_hash = await bcrypt.hash(contraseña, salt);
        const token = crypto.randomBytes(32).toString("hex");

        const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3100";

        // Construir URL de confirmación correctamente
        const confirmUrl = new URL(`/api/user/confirm-email`, BACKEND_URL);
        confirmUrl.searchParams.append("token", token);

        const htmlContent = `
          <h1>Hola ${nombre},</h1>
          <p>Gracias por registrarte. Por favor confirma tu correo haciendo clic en el enlace:</p>
          <a href="${confirmUrl.href}">Confirmar correo</a>
        `;

        try {
            await sendMail("gmail", correo, "Confirma tu correo electrónico", htmlContent);
        } catch (error) {
            console.error("Error al enviar el correo:", error);
            return res.status(500).json({ error: "Error al enviar el correo de confirmación." });
        }

        const [result] = await pool.query(
            "INSERT INTO usuarios (nombre, apellido, usuario, correo, contraseña_hash, genero, email_verified, token) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [nombre, apellido, usuario, correo, contraseña_hash, genero, false, token]
        );

        res.status(201).json({
            message: "Usuario registrado exitosamente. Revisa tu correo para confirmar tu cuenta.",
            userId: result.insertId,
        });
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
});

module.exports = router;