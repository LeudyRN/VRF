const express = require("express");
const pool = require("../config/db");
const router = express.Router();

router.get("/confirm-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
      return res.status(400).json({ error: "El token es requerido." });
  }

  try {
      const [result] = await pool.query("SELECT id FROM usuarios WHERE token = ?", [token]);

      if (result.length === 0) {
          return res.status(404).json({ error: "Token inválido o ya usado." });
      }

      await pool.query("UPDATE usuarios SET email_verified = true, token = NULL WHERE token = ?", [token]);

      res.redirect("http://localhost:5173/register-card");
  } catch (error) {
      console.error("Error confirmando el correo:", error);
      res.status(500).json({ error: "Error en el servidor." });
  }
});

module.exports = router;
