const express = require("express");
const router = express.Router();
const axios = require("axios");

// Endpoint para procesar pagos
router.post("/processPayment", async (req, res) => {
  console.log(req.body); // Verifica los datos que se están enviando

  try {
    const { userId, amount, cardNumber, cardHolder, expiryDate, cvv } = req.body;

    if (!userId || !amount || !cardNumber || !cardHolder || !expiryDate || !cvv) {
      return res.status(400).json({ error: "Faltan datos obligatorios: userId, amount, cardNumber, cardHolder, expiryDate, o cvv." });
    }

    // Aquí mapeas los datos que recibes del frontend con los campos que Azul espera
    const azulPayload = {
      AuthorizationCode: userId, // O el valor que necesites para AuthorizationCode
      AzulOrderId: "",  // Puedes generar un valor o dejarlo vacío si no se requiere
      CustomOrderId: "",  // También puedes generar un CustomOrderId
      DataVaultBrand: "",  // Completar según lo necesario
      DataVaultExpiration: "",  // Completar según lo necesario
      DataVaultToken: "",  // Completar según lo necesario
      DateTime: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),  // Formato YYYYMMDDHHMMSS
      ErrorDescription: "",
      IsoCode: "DOP",
      LotNumber: "",
      RRN: "",
      ResponseCode: "",
      ResponseMessage: "",
      Ticket: "",
      Amount: amount,
      CardNumber: cardNumber,
      CardHolder: cardHolder,
      ExpiryDate: expiryDate,
      CVV: cvv
    };

    // Realizar la solicitud a la API de Azul
    const response = await axios.post(
      "https://pruebas.azul.com.do/webservices/JSON/Default.aspx",  // Endpoint de la API Azul
      azulPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "Auth1": process.env.AZUL_API_KEY  // Usa una variable de entorno para la clave de autenticación
        }
      }
    );

    // Verificar si la respuesta de Azul es exitosa
    if (response.data && response.data.ResponseCode === "00") {
      return res.json({ success: true, data: response.data });
    } else {
      return res.status(400).json({ error: "Error en la respuesta de Azul", details: response.data });
    }
  } catch (error) {
    // Manejo de errores
    console.error("Error al procesar el pago:", error.message);
    return res.status(500).json({ error: "Error al procesar el pago", details: error.message });
  }
});

module.exports = router;
