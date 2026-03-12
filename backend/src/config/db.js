import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool;

export function getDbPool() {
  if (pool) return pool;

  if (env.databaseUrl) {
    pool = mysql.createPool(env.databaseUrl);
    return pool;
  }

  pool = mysql.createPool({
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName,
    waitForConnections: true,
    connectionLimit: 10,
  });
  return pool;
}
