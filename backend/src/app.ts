import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { logger } from "./config/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();

// Unauthenticated liveness/readiness probe for container orchestrators (Docker HEALTHCHECK, k8s, load balancers).
// Kept outside /api/v1 and ahead of all other middleware so it stays fast and dependency-free.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/api/v1/health" || req.url === "/health" } })
);

app.use("/uploads", express.static(path.join(process.cwd(), env.uploadDir)));

app.use("/api/v1", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
