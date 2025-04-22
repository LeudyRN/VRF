const router = require("express").Router();

// Función para configurar encabezados de eliminación de caché
const setNoCacheHeaders = (res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

router.post("/", (req, res) => {
  if (req.session && typeof req.session.destroy === "function") { // ✅ Validación adicional
    req.session.destroy((err) => {
      if (err) {
        console.error("❌ Error destruyendo la sesión:", err); // ✅ Muestra el objeto completo del error
        return res.status(500).json({ error: "Error cerrando sesión. Inténtalo nuevamente." });
      }

      res.clearCookie("connect.sid");
      setNoCacheHeaders(res);
      return res.status(200).json({ message: "✅ Sesión cerrada correctamente y caché eliminado." });
    });
  } else {
    setNoCacheHeaders(res);
    return res.status(200).json({ message: "ℹ️ No había sesión activa." });
  }
});

module.exports = router;