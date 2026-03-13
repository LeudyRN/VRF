import { asAppError } from "../../shared/errors/appError.js";
import { authUseCases } from "./authUseCases.js";

export const authController = {
  async register(req, res) {
    try {
      res.status(201).json(await authUseCases.register(req.body));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async verifyEmail(req, res) {
    try {
      res.json(await authUseCases.verifyEmail(req.query.token));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async login(req, res) {
    try {
      res.json(await authUseCases.login(req.body));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async forgotPassword(req, res) {
    try {
      res.json(await authUseCases.forgotPassword(req.body.email));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async resetPassword(req, res) {
    try {
      res.json(await authUseCases.resetPassword(req.body));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async changePassword(req, res) {
    try {
      res.json(
        await authUseCases.changePassword({
          userId: req.auth.userId,
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword,
        })
      );
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async me(req, res) {
    try {
      res.json(await authUseCases.getProfile(req.auth.userId));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },

  async updateProfile(req, res) {
    try {
      res.json(await authUseCases.updateProfile({ userId: req.auth.userId, name: req.body.name }));
    } catch (error) {
      const appError = asAppError(error);
      res.status(appError.statusCode).json({ error: appError.message, code: appError.code });
    }
  },
};
