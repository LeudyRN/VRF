const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");

// Función para encriptar datos sensibles
const encryptData = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return { encryptedData: encrypted, iv: iv.toString("hex") };
};

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

    // Encriptar datos sensibles antes de enviarlos a Azul
    const { encryptedData: encryptedCard, iv: cardIv } = encryptData(cardNumber);
    const { encryptedData: encryptedCVV, iv: cvvIv } = encryptData(cvv);

    // Construcción del payload para Azul
    const azulPayload = {
      AuthorizationCode: userId || "TEST_USER",
      DateTime: new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14),
      IsoCode: "DOP",
      Amount: amount,
      CardNumber: encryptedCard,
      CardHolder: cardHolder,
      ExpiryDate: expiryDate,
      CVV: encryptedCVV,
      IV_Card: cardIv,
      IV_CVV: cvvIv,
    };

    console.log("Payload enviado a Azul:", azulPayload);

    // Realizar la solicitud a la API de Azul con autenticación
    const response = await axios.post(
      "https://pruebas.azul.com.do/webservices/JSON/Default.aspx",
      azulPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.AZUL_API_KEY}`,
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
    // Manejo de errores detallado
    console.error("❌ Error al procesar el pago:", { message: error.message, stack: error.stack });
    return res.status(500).json({
      error: "Error al procesar el pago",
      details: error.message,
    });
  }
});

module.exports = router;