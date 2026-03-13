import { userRepository } from "../repositories/userRepository.js";

export async function requireVerifiedAndActive(req, res, next) {
  const user = await userRepository.findById(req.auth.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (!user.email_verified) return res.status(403).json({ error: "EMAIL_NOT_VERIFIED" });
  if (user.subscription_status !== "active") return res.status(403).json({ error: "SUBSCRIPTION_NOT_ACTIVE" });
  return next();
}
