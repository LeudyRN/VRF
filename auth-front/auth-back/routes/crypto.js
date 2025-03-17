const CryptoJS = require("crypto-js");

router.post("/", async (req, res) => {
  const { usuario, contraseña } = req.body;

  if (!usuario || !contraseña) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios" });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, nombre, usuario, contraseña_hash FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = users[0];

    // Descifrar la contraseña
    const decryptedPassword = CryptoJS.AES.decrypt(
      contraseña,
      "clave_secreta"
    ).toString(CryptoJS.enc.Utf8);

    const validPassword = await bcrypt.compare(decryptedPassword, user.contraseña_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar y enviar tokens como antes...
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});
