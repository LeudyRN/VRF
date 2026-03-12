import dotenv from "dotenv";
dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3100),
  mysqlHost: process.env.DB_HOST || "localhost",
  mysqlUser: process.env.DB_USER || "root",
  mysqlPassword: process.env.DB_PASSWORD || "",
  mysqlDatabase: process.env.DB_NAME || "vrf_platform",
};
