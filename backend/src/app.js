import cors from "cors";
import express from "express";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { parseCorsOrigins } from "./config/environment.js";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middleware/errorMiddleware.js";
import {
  rateLimit,
  sanitizeRequest,
  secureCookies,
  securityHeaders,
} from "./middleware/securityMiddleware.js";

// The in-scope REST surface for v1 (see build-spec.md). Out-of-scope routes
// (ai, copilot, predictive, enterprise, tenant, billing, audit, analytics, iot,
// system, settings, notifications, search, backup, docs, executive) are
// intentionally NOT mounted — requests to them 404.
export const IN_SCOPE_API_MOUNTS = [
  ["/api/auth", authRoutes],
  ["/api/users", userRoutes],
];

// Build the Express app without binding a port or starting MQTT/Socket.IO, so
// tests can drive it with supertest. index.js wraps this with the HTTP server.
export const createApp = () => {
  const app = express();
  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(securityHeaders);
  app.use(secureCookies);
  app.use(
    cors({
      origin: allowedOrigins === "*" ? true : allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(sanitizeRequest);
  app.use(
    rateLimit({
      max: Number(process.env.RATE_LIMIT_MAX || 600),
      windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
    })
  );

  for (const [mountPath, router] of IN_SCOPE_API_MOUNTS) {
    app.use(mountPath, router);
  }

  app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "ok" });
  });

  app.get("/", (req, res) => {
    res.json({ success: true, message: "Kavach API running" });
  });

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};

export default createApp;
