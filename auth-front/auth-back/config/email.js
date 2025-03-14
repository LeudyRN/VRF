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
  let transporter;

  if (service === "gmail") {
    transporter = gmailTransporter;
  } else if (service === "outlook") {
    transporter = outlookTransporter;
  } else {
    throw new Error("Servicio de correo no soportado");
  }

  const mailOptions = {
    from: transporter.options.auth.user,
    to,
    subject,
    html,
  };


  return transporter.sendMail(mailOptions);
}

module.exports = sendMail;
