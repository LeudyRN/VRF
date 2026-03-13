import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";

export function signJwt(payload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, env.jwtSecret);
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}
