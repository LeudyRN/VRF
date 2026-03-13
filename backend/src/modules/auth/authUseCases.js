import bcrypt from "bcryptjs";
import { subscriptionRepository } from "../../repositories/subscriptionRepository.js";
import { userRepository } from "../../repositories/userRepository.js";
import { AppError } from "../../shared/errors/appError.js";
import { randomToken, signJwt } from "../../utils/jwt.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../../services/emailService.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const authUseCases = {
  async register({ name, email, password }) {
    if (!name || !email || !password) {
      throw new AppError("name, email and password are required", 400, "MISSING_FIELDS");
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new AppError("Invalid email", 400, "INVALID_EMAIL");
    }

    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already registered", 409, "EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomToken(24);
    const userId = await userRepository.create({ name, email, passwordHash, verificationToken });

    await sendVerificationEmail(email, verificationToken);

    return {
      id: userId,
      message: "User registered. Check your email to verify your account.",
      verificationToken,
    };
  },

  async verifyEmail(token) {
    if (!token) {
      throw new AppError("Missing token", 400, "TOKEN_REQUIRED");
    }

    const verified = await userRepository.verifyEmail(token);
    if (!verified) {
      throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
    }

    return { message: "Email verified successfully" };
  },

  async login({ email, identifier, password }) {
    const loginIdentifier = (identifier || email || "").trim();
    if (!loginIdentifier || !password) {
      throw new AppError("identifier and password are required", 400, "MISSING_FIELDS");
    }

    const user = await userRepository.findByLoginIdentifier(loginIdentifier);
    if (!user) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    const validPassword = await bcrypt.compare(password || "", user.password_hash);
    if (!validPassword) {
      throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    }

    if (!user.email_verified) {
      throw new AppError("Email not verified", 403, "EMAIL_NOT_VERIFIED");
    }

    return {
      token: signJwt({ userId: user.id, email: user.email }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: !!user.email_verified,
        subscriptionStatus: user.subscription_status,
      },
    };
  },

  async forgotPassword(email) {
    if (!email) {
      throw new AppError("Email is required", 400, "EMAIL_REQUIRED");
    }

    const user = await userRepository.findByEmail(email);
    let resetToken;

    if (user) {
      resetToken = randomToken(24);
      await userRepository.setResetToken(email, resetToken);
      await sendPasswordResetEmail(email, resetToken);
    }

    return {
      message: "If the email exists, a reset link has been sent.",
      resetToken,
    };
  },

  async resetPassword({ token, password }) {
    if (!token || !password) {
      throw new AppError("Token and password are required", 400, "MISSING_FIELDS");
    }

    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const reset = await userRepository.resetPassword(token, passwordHash);
    if (!reset) {
      throw new AppError("Invalid or expired token", 400, "INVALID_TOKEN");
    }

    return { message: "Password reset successful" };
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      throw new AppError("currentPassword and newPassword are required", 400, "MISSING_FIELDS");
    }

    if (newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400, "WEAK_PASSWORD");
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      throw new AppError("Current password is incorrect", 401, "INVALID_CURRENT_PASSWORD");
    }

    await userRepository.changePassword(userId, await bcrypt.hash(newPassword, 10));
    return { message: "Password changed" };
  },

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: !!user.email_verified,
      subscriptionStatus: user.subscription_status,
      subscription: await subscriptionRepository.findByUserId(user.id),
    };
  },

  async updateProfile({ userId, name }) {
    if (!name?.trim()) {
      throw new AppError("name is required", 400, "NAME_REQUIRED");
    }

    await userRepository.updateName(userId, name.trim());
    return { message: "Profile updated" };
  },
};
