const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyToken = (req, res, next) => {
  // Obtener el token del encabezado Authorization
  const token = req.header("Authorization");

  // Verificar si el token está presente y tiene el formato correcto
  if (!token || !token.startsWith("Bearer ")) {
    console.error("Token no proporcionado o formato incorrecto:", token);
    return res.status(401).json({
      error: "Acceso denegado, token no proporcionado o formato incorrecto.",
    });
  }

  // Extraer la parte del token (después de "Bearer")
  const tokenPart = token.split(" ")[1];

  try {
    // Verificar el token utilizando la clave secreta
    const verified = jwt.verify(tokenPart, process.env.JWT_SECRET);
    console.log("Token verificado con éxito:", verified);

    // Almacenar el contenido del token en req.user (para acceso en rutas posteriores)
    req.user = verified;

    // Continuar con la siguiente función del middleware o ruta
    next();
  } catch (error) {
    // Manejo de errores específicos
    if (error.name === "TokenExpiredError") {
      console.error("Error: El token ha expirado.");
      return res.status(401).json({
        error: "El token ha expirado. Por favor, inicia sesión de nuevo.",
      });
    }

    console.error("Error verificando token:", error.message);
    return res.status(400).json({ error: "Token inválido o expirado." });
  }
};

module.exports = verifyToken;
