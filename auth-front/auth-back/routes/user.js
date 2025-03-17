const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Confirmar correo
router.get("/confirm-email", async (req, res) => {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: "Token no proporcionado." });
    }

    try {
      // Buscar el usuario con el token
      const [user] = await pool.query("SELECT id FROM usuarios WHERE token = ?", [token]);

      if (!user || user.length === 0) {
        return res.status(400).json({ error: "El enlace de confirmación es inválido o ya fue utilizado." });
      }

      // Marcar el email como verificado y eliminar el token
      await pool.query("UPDATE usuarios SET email_verified = true, token = NULL WHERE id = ?", [user[0].id]);

      res.json({ message: "Correo confirmado exitosamente." });
    } catch (error) {
      console.error("Error al confirmar el correo:", error);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  });

router.get("/status", async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
      console.error("Falta el ID de usuario");
      return res.status(400).json({ error: "El ID de usuario es requerido." });
    }

    try {
      const [result] = await pool.query("SELECT email_verified FROM usuarios WHERE id = ?", [userId]);

      if (result.length === 0) {
        console.error("Usuario no encontrado");
        return res.status(404).json({ error: "Usuario no encontrado." });
      }

      res.json({ email_verified: result[0].email_verified });
    } catch (error) {
      console.error("Error verificando el estado del correo:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  });


module.exports = router;
