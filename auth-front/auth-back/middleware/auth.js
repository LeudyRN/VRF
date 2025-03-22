const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

// Función para verificar el access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return "EXPIRED"; // Marcar token como expirado
    }
    throw new Error("Token inválido.");
  }
};

// Función para renovar el access token
const renewAccessToken = async (refreshToken) => {
  try {
    // Verificar el refresh token
    const refreshVerified = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    // Generar un nuevo access token
    const newAccessToken = jwt.sign({ id: refreshVerified.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    return newAccessToken;
  } catch (error) {
    console.error("Error verificando refresh token:", error.message);
    throw new Error("Refresh token inválido o expirado.");
  }
};

// Middleware principal
const verifyToken = async (req, res, next) => {
  const authorizationHeader = req.header("Authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    console.error("Token no proporcionado o formato incorrecto:", authorizationHeader);
    return res
      .status(401)
      .json({ error: "Acceso denegado. Token no proporcionado o formato incorrecto." });
  }

  const tokenPart = authorizationHeader.split(" ")[1];

  try {
    const verified = verifyAccessToken(tokenPart);

    if (verified === "EXPIRED") {
      console.warn("El token ha expirado. Intentando renovar...");

      // Decodificar el token expirado para obtener el userId
      const decodedExpiredToken = jwt.decode(tokenPart);
      if (!decodedExpiredToken || !decodedExpiredToken.id) {
        return res.status(401).json({ error: "Token inválido o expirado." });
      }

      // Buscar el refresh token en la base de datos
      const [userResult] = await pool.query("SELECT refresh_token FROM usuarios WHERE id = ?", [
        decodedExpiredToken.id,
      ]);
      if (userResult.length === 0 || !userResult[0].refresh_token) {
        return res.status(401).json({ error: "No se encontró un refresh token válido." });
      }

      // Renovar el token
      const newAccessToken = await renewAccessToken(userResult[0].refresh_token);

      // Enviar el nuevo token y continuar
      res.setHeader("x-new-token", newAccessToken);
      req.user = { id: decodedExpiredToken.id };
      return next();
    }

    // Token válido, asignar datos al request
    req.user = verified;
    next();
  } catch (error) {
    console.error("Error verificando token:", error.message);
    res.status(401).json({ error: error.message });
  }
};

module.exports = verifyToken;