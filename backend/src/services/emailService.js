import { env } from "../config/env.js";

let nodemailerModule = null;
try {
  nodemailerModule = await import("nodemailer");
} catch {
  nodemailerModule = null;
}

const transporter = nodemailerModule
  ? nodemailerModule.default.createTransport({
      service: "gmail",
      auth: { user: env.emailUser, pass: env.emailPass },
    })
  : null;

export async function sendEmail({ to, subject, html }) {
  if (!transporter) {
    console.warn("nodemailer is not installed. Email delivery is skipped.");
    return { skipped: true, to, subject };
  }
  return transporter.sendMail({ from: env.emailUser, to, subject, html });
}

export async function sendVerificationEmail(email, token) {
  const link = `${env.appUrl}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Verify your email",
    html: `<h2>Verify your account</h2><p>Click the link below to verify your account:</p><a href="${link}">${link}</a>`,
  });
}

export async function sendPasswordResetEmail(email, token) {
  const link = `${env.appUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: "Reset your password",
    html: `<h2>Password reset</h2><p>Click to reset your password:</p><a href="${link}">${link}</a>`,
  });
}
