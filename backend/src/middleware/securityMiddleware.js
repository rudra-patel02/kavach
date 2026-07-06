const clientHits = new Map();
const authFailures = new Map();

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const sanitizeString = (value) =>
  value.replace(/\0/g, "").replace(/<script\b[^>]*>/gi, "");

const sanitizeObject = (value, depth = 0) => {
  if (depth > 10) {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item, depth + 1));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (key.startsWith("$") || key.includes(".")) {
      return acc;
    }

    acc[key] = sanitizeObject(item, depth + 1);
    return acc;
  }, {});
};

export const securityHeaders = (req, res, next) => {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' https: data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "connect-src 'self' ws: wss:",
    "upgrade-insecure-requests",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");

  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
};

export const secureCookies = (req, res, next) => {
  const originalCookie = res.cookie.bind(res);

  res.cookie = (name, value, options = {}) =>
    originalCookie(name, value, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      ...options,
    });

  next();
};

export const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeObject(req.body);
  Object.defineProperty(req, "query", {
    value: sanitizeObject(req.query),
    configurable: true,
    enumerable: true,
  });
  Object.defineProperty(req, "params", {
    value: sanitizeObject(req.params),
    configurable: true,
    enumerable: true,
  });
  next();
};

export const rateLimit = ({
  windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max = Number(process.env.RATE_LIMIT_MAX || 600),
} = {}) => {
  const cleanupInterval = Math.max(windowMs, 60 * 1000);
  let lastCleanup = Date.now();

  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.ip}:${req.path}`;
    const current = clientHits.get(key);

    if (now - lastCleanup > cleanupInterval) {
      for (const [hitKey, hit] of clientHits.entries()) {
        if (hit.resetAt <= now) {
          clientHits.delete(hitKey);
        }
      }

      lastCleanup = now;
    }

    const hit =
      current && current.resetAt > now
        ? current
        : {
            count: 0,
            resetAt: now + windowMs,
          };

    hit.count += 1;
    clientHits.set(key, hit);

    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - hit.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(hit.resetAt / 1000)));

    if (hit.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please retry after the rate limit window.",
      });
    }

    next();
  };
};

const getAuthKey = (req) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  return `${req.ip}:${email || "unknown"}`;
};

const pruneAuthFailures = (now) => {
  for (const [key, value] of authFailures.entries()) {
    if (value.resetAt <= now) {
      authFailures.delete(key);
    }
  }
};

export const bruteForceProtection = ({
  windowMs = Number(process.env.BRUTE_FORCE_WINDOW_MS || 15 * 60 * 1000),
  maxFailures = Number(process.env.BRUTE_FORCE_MAX_FAILURES || 8),
} = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    pruneAuthFailures(now);

    const hit = authFailures.get(getAuthKey(req));

    if (hit && hit.count >= maxFailures && hit.resetAt > now) {
      res.setHeader("Retry-After", String(Math.ceil((hit.resetAt - now) / 1000)));
      return res.status(429).json({
        success: false,
        message: "Too many failed authentication attempts. Try again later.",
      });
    }

    next();
  };
};

export const recordAuthFailure = (req) => {
  const windowMs = Number(process.env.BRUTE_FORCE_WINDOW_MS || 15 * 60 * 1000);
  const now = Date.now();
  const key = getAuthKey(req);
  const current = authFailures.get(key);
  const hit =
    current && current.resetAt > now
      ? current
      : {
          count: 0,
          resetAt: now + windowMs,
        };

  hit.count += 1;
  authFailures.set(key, hit);

  return hit.count;
};

export const clearAuthFailures = (req) => {
  authFailures.delete(getAuthKey(req));
};
