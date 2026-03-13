import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(cors());

  app.use((req, _res, next) => {
    if (req.originalUrl === "/api/stripe/webhook") return next();
    return express.json()(req, _res, next);
  });

  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, _res, next) => {
    req.rawBody = req.body.toString("utf8");
    next();
  });

  app.get("/health", (_, res) => res.json({ ok: true }));
  app.use("/api", apiRouter);
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  app.use(express.json());
  app.get("/health", (_, res) => res.json({ ok: true }));
  app.use("/api", apiRouter);

  return app;
}
