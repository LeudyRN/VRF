const nodemailer = require("nodemailer");

const gmailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const outlookTransporter = nodemailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASS,
  },
});

async function sendMail(service, to, subject, html) {
  if (!to || !subject || !html) {
    throw new Error("Los parámetros 'to', 'subject', y 'html' son obligatorios.");
  }

  let transporter;

  switch (service) {
    case "gmail":
      transporter = gmailTransporter;
      break;
    case "outlook":
      transporter = outlookTransporter;
      break;
    default:
      throw new Error("Servicio de correo no soportado.");
  }

  const mailOptions = {
    from: transporter.options.auth.user,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo enviado con éxito: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Error enviando el correo:", error.message);
    throw new Error("No se pudo enviar el correo.");
  }
}

module.exports = sendMail;