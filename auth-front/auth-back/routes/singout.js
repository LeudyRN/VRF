const express = require("express");
const pool = require("../config/db"); // 🔥 Asegúrate de importar la conexión a la BD
const router = express.Router();

// Función para configurar encabezados de eliminación de caché
const setNoCacheHeaders = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

// ✅ Unificación de lógica para cerrar sesión y eliminar el refreshToken
router.post("/", async (req, res) => {
  const userId = req.body.userId || req.session?.userId;

  if (!userId) {
    console.warn("⚠️ No se proporcionó userId para cerrar sesión.");
    return res.status(400).json({ error: "Error: No se proporcionó userId para cerrar sesión." });
  }

  try {
    // 🔥 Eliminar `refreshToken` sin verificar primero si existe
    const deleteResult = await pool.query("UPDATE usuarios SET refresh_token = NULL WHERE id = ?", [userId]);

    if (deleteResult.affectedRows > 0) {
      console.log("✅ Refresh token eliminado correctamente para el usuario:", userId);
    } else {
      console.warn("⚠️ No se pudo eliminar el refresh token, puede que ya haya sido eliminado.");
    }
  } catch (error) {
    console.error("❌ Error al eliminar el refresh token:", error.message);
    return res.status(500).json({ error: "Error en el servidor al eliminar el refresh token." });
  }

  // 🔥 Manejar la destrucción de sesión correctamente
  if (req.session?.destroy) {
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error al destruir la sesión:", err);
        return res.status(500).json({ error: "Error cerrando sesión. Inténtalo nuevamente." });
      }
      res.clearCookie("connect.sid");
      setNoCacheHeaders(res);
      return res.status(200).json({ message: "✅ Sesión cerrada correctamente y caché eliminado." });
    });
  } else {
    setNoCacheHeaders(res);
    return res.status(200).json({ message: "✅ Refresh token eliminado, pero no había sesión activa." });
  }
});

module.exports = router;