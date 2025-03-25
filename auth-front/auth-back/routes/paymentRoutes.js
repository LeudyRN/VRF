const express = require("express");
const router = express.Router();
const axios = require("axios");

// Endpoint para procesar pagos
router.post("/processPayment", async (req, res) => {
  console.log("Datos recibidos en el backend:", req.body);

  try {
    const { userId, amount, cardNumber, cardHolder, expiryDate, cvv } = req.body;

    // Validación de datos obligatorios
    if (!userId || !amount || !cardNumber || !cardHolder || !expiryDate || !cvv) {
      return res.status(400).json({
        error: "Faltan datos obligatorios: userId, amount, cardNumber, cardHolder, expiryDate, o cvv.",
      });
    }

    // Construcción del payload para Azul
    const azulPayload = {
      AuthorizationCode: userId || "TEST_USER",
      DateTime: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
      IsoCode: "DOP",
      Amount: amount,
      CardNumber: cardNumber,
      CardHolder: cardHolder,
      ExpiryDate: expiryDate,
      CVV: cvv,
    };

    console.log("Payload enviado a Azul:", azulPayload);

    // Realizar la solicitud a la API de Azul
    const response = await axios.post(
      "https://pruebas.azul.com.do/webservices/JSON/Default.aspx", // Endpoint de la API Azul
      azulPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "Auth1": "", // Enviar vacío si no tienes una clave (o prueba con "TEST")
        },
      }
    );

    // Verificar si la respuesta de Azul es exitosa
    if (response.data && response.data.ResponseCode === "00") {
      return res.json({ success: true, data: response.data });
    } else {
      return res.status(400).json({
        error: "Error en la respuesta de Azul",
        details: response.data,
      });
    }
  } catch (error) {
    // Manejo de errores
    console.error("Error al procesar el pago:", error.message);
    return res.status(500).json({
      error: "Error al procesar el pago",
      details: error.message,
    });
  }
});

module.exports = router;