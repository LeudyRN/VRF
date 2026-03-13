import dotenv from "dotenv";
dotenv.config();

const toNum = (v, d) => (v ? Number(v) : d);

export const env = {
  port: toNum(process.env.PORT, 3100),
  databaseUrl: process.env.DATABASE_URL || "",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: toNum(process.env.DB_PORT, 3306),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "",
  dbName: process.env.DB_NAME || "vrf_platform",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  emailUser: process.env.EMAIL_USER || "",
  emailPass: process.env.EMAIL_PASS || "",
  appUrl: process.env.APP_URL || "http://localhost:5173",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceId: process.env.STRIPE_PRICE_ID || "",

export const env = {
  port: Number(process.env.PORT || 3100),
  mysqlHost: process.env.DB_HOST || "localhost",
  mysqlUser: process.env.DB_USER || "root",
  mysqlPassword: process.env.DB_PASSWORD || "",
  mysqlDatabase: process.env.DB_NAME || "vrf_platform",

};
