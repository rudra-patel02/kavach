import { randomUUID } from "node:crypto";

const metrics = {
  errors: 0,
  requests: 0,
  totalLatencyMs: 0,
  routes: new Map(),
};

const logJson = (level, message, fields = {}) => {
  const payload = {
    level,
    message,
    service: "kavach-backend",
    timestamp: new Date().toISOString(),
    ...fields,
  };

  console[level === "error" ? "error" : "log"](JSON.stringify(payload));
};

export const requestContext = (req, res, next) => {
  req.id = req.get("x-request-id") || randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
};

export const requestMetrics = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1000000;
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    const route = metrics.routes.get(routeKey) || {
      count: 0,
      errors: 0,
      latencyMs: 0,
    };

    metrics.requests += 1;
    metrics.totalLatencyMs += latencyMs;
    route.count += 1;
    route.latencyMs += latencyMs;

    if (res.statusCode >= 500) {
      metrics.errors += 1;
      route.errors += 1;
    }

    metrics.routes.set(routeKey, route);
    logJson(res.statusCode >= 500 ? "error" : "info", "http_request", {
      latencyMs: Number(latencyMs.toFixed(2)),
      method: req.method,
      path: req.originalUrl,
      requestId: req.id,
      statusCode: res.statusCode,
      userId: req.user?.id,
    });
  });

  next();
};

export const getDiagnostics = () => ({
  averageLatencyMs:
    metrics.requests > 0
      ? Number((metrics.totalLatencyMs / metrics.requests).toFixed(2))
      : 0,
  errorRate:
    metrics.requests > 0
      ? Number(((metrics.errors / metrics.requests) * 100).toFixed(2))
      : 0,
  errors: metrics.errors,
  requests: metrics.requests,
  routes: Array.from(metrics.routes.entries()).map(([route, value]) => ({
    averageLatencyMs:
      value.count > 0 ? Number((value.latencyMs / value.count).toFixed(2)) : 0,
    count: value.count,
    errors: value.errors,
    route,
  })),
});
