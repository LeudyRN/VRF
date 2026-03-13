export type EmailPayload = { to: string; subject: string; html: string };

export async function sendEmail(payload: EmailPayload): Promise<unknown> {
  // Runtime implementation exists in `emailService.js`.
  // This TS module documents the contract requested by architecture/spec.
  return payload;
}

export async function sendVerificationEmail(email: string, token: string): Promise<unknown> {
  return sendEmail({ to: email, subject: "Verify your email", html: `/verify-email?token=${token}` });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<unknown> {
  return sendEmail({ to: email, subject: "Reset password", html: `/reset-password?token=${token}` });
}
