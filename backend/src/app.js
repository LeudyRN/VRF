import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  const jsonParser = express.json();

  app.use(cors());

  app.use((req, res, next) => {
    if (req.originalUrl === "/api/stripe/webhook") {
      return next();
    }
    return jsonParser(req, res, next);
  });

  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
    req.rawBody = req.body.toString("utf8");
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api", apiRouter);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
