const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 3100;

// Configuración de CORS
app.use(
  cors({
    origin: "http://localhost:5173", // Permite solicitudes desde el frontend
    credentials: true // Habilita el manejo de cookies
  })
);

app.use(express.json());

// Registro de rutas
app.use("/api/sing", require("./routes/sing"));
app.use("/api/login", require("./routes/login"));
app.use("/api/user", require("./routes/user"));
app.use("/api/todos", require("./routes/todos"));
app.use("/api/refresh-token", require("./routes/refreshToken"));
app.use("/api/singout", require("./routes/singout"));
app.use("/api/register-card", require("./routes/registerCard"));

// Ruta de prueba para conexión
app.get("/", (req, res) => {
  res.send("Servidor operativo");
});

// Inicialización del servidor
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
