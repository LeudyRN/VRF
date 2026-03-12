import bcrypt from "bcryptjs";
import { userRepository } from "../repositories/userRepository.js";
import { subscriptionRepository } from "../repositories/subscriptionRepository.js";
import { randomToken, signJwt } from "../utils/jwt.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authController = {
  async register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "name, email and password are required" });
    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: "Invalid email" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const existing = await userRepository.findByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomToken(24);
    const userId = await userRepository.create({ name, email, passwordHash, verificationToken });
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({ id: userId, message: "User registered. Check your email to verify your account.", verificationToken });
  },

  async verifyEmail(req, res) {
    const token = req.query.token;
    if (!token) return res.status(400).json({ error: "Missing token" });
    const ok = await userRepository.verifyEmail(token);
    if (!ok) return res.status(400).json({ error: "Invalid or expired token" });
    return res.json({ message: "Email verified successfully" });
  },

  async login(req, res) {
    const { email, password } = req.body;
    const user = await userRepository.findByEmail(email || "");
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password || "", user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.email_verified) return res.status(403).json({ error: "Email not verified" });

    const token = signJwt({ userId: user.id, email: user.email });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: !!user.email_verified,
        subscriptionStatus: user.subscription_status,
      },
    });
  },

  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await userRepository.findByEmail(email);
    let devToken;
    if (user) {
      const resetToken = randomToken(24);
      await userRepository.setResetToken(email, resetToken);
      await sendPasswordResetEmail(email, resetToken);
      devToken = resetToken;
    }
    return res.json({ message: "If the email exists, a reset link has been sent.", resetToken: devToken });
  },

  async resetPassword(req, res) {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password are required" });
    if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const hash = await bcrypt.hash(password, 10);
    const ok = await userRepository.resetPassword(token, hash);
    if (!ok) return res.status(400).json({ error: "Invalid or expired token" });

    return res.json({ message: "Password reset successful" });
  },

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const user = await userRepository.findById(req.auth.userId);
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    await userRepository.changePassword(req.auth.userId, hash);
    return res.json({ message: "Password changed" });
  },

  async me(req, res) {
    const user = await userRepository.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const subscription = await subscriptionRepository.findByUserId(user.id);
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: !!user.email_verified,
      subscriptionStatus: user.subscription_status,
      subscription,
    });
  },

  async updateProfile(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });
    await userRepository.updateName(req.auth.userId, name);
    return res.json({ message: "Profile updated" });
  },
};
