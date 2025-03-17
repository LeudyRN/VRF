const router = require("express").Router();

router.post("/", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        return res.status(500).json({ message: "Error cerrando sesión" });
      } else {
        res.clearCookie("connect.sid"); // Limpia la cookie de la sesión

        // Agregar encabezados para asegurarse de que la caché sea eliminada
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
        res.setHeader("Pragma", "no-cache"); // Compatibilidad con navegadores antiguos
        res.setHeader("Expires", "0"); // Evita que haya caché en el cliente

        return res.status(200).json({ message: "Sesión cerrada correctamente y caché del servidor eliminado." });
      }
    });
  } else {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.status(200).json({ message: "No había sesión activa." });
  }
});

module.exports = router;
