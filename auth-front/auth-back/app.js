const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3100;

// Configuración de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Origen no permitido por CORS"));
      }
    },
    credentials: true, // Habilita el manejo de cookies
  })
);

// Middleware para registro de solicitudes
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware para analizar JSON
app.use(express.json());

// Registro de rutas
app.use("/api/sing", require("./routes/sing"));
app.use("/api/login", require("./routes/login"));
app.use("/api/register-card", require("./routes/registerCard"));
app.use("/api/user", require("./routes/user"));
app.use("/api/todos", require("./routes/todos"));
app.use("/api/refreshToken", require("./routes/refreshToken"));
app.use("/api/singout", require("./routes/singout"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/files", require("./routes/files"));

// Ruta de prueba para conexión
app.get("/", (req, res) => {
  res.send("Servidor operativo");
});

// Middleware para manejo de errores globales
app.use((err, req, res, next) => {
  console.error("Error no controlado:", err.message);
  res.status(500).json({ error: "Error interno del servidor." });
});

// Inicialización del servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto: ${port}`);
  console.log(`Entorno actual: ${process.env.NODE_ENV || "desarrollo"}`);
});