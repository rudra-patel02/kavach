const booleanValues = new Map([
  ["1", true],
  ["true", true],
  ["yes", true],
  ["on", true],
  ["0", false],
  ["false", false],
  ["no", false],
  ["off", false],
]);

const normalizeOrigin = (origin) => {
  const value = String(origin || "").trim().replace(/\/+$/, "");

  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

export const parseCorsOrigins = (value) => {
  if (!value || value.trim() === "*" || value.trim() === "") {
    return "*";
  }

  const origins = value
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return origins.length > 0 ? origins : "*";
};

export const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return booleanValues.has(normalized)
    ? booleanValues.get(normalized)
    : defaultValue;
};

const parseInteger = (name, defaultValue, { min, max } = {}) => {
  const rawValue = process.env[name];
  const value =
    rawValue === undefined || rawValue === ""
      ? defaultValue
      : Number.parseInt(rawValue, 10);

  if (
    !Number.isInteger(value) ||
    (min !== undefined && value < min) ||
    (max !== undefined && value > max)
  ) {
    throw new Error(
      `${name} must be an integer` +
        (min !== undefined || max !== undefined
          ? ` between ${min ?? "-infinity"} and ${max ?? "infinity"}`
          : "")
    );
  }

  return value;
};

// A secret that is clearly a copy-paste placeholder (long enough to pass the
// length check, but obviously not a real random secret). Refused in production
// so a stock compose/.env can never boot a real deployment on a fake secret.
const PLACEHOLDER_SECRET_PATTERN =
  /(replace[-_ ]?with|change[-_ ]?me|changeme|placeholder|your[-_ ]?secret|secret[-_ ]?here|example|dummy|todo|^0+$|^(test|dev|sample)[-_])|abcdef/i;

export const isPlaceholderSecret = (value = "") =>
  PLACEHOLDER_SECRET_PATTERN.test(String(value));

const requireSecret = (name, { minLength = 32, productionOnly = false } = {}) => {
  const value = process.env[name];

  if (!value) {
    if (productionOnly && process.env.NODE_ENV !== "production") {
      return "";
    }

    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (value.length < minLength) {
    const message = `${name} must be at least ${minLength} characters long`;

    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }

    console.warn(`${message}; rotate it before production use`);
  }

  // A placeholder that slipped through by being long enough is still fake.
  if (process.env.NODE_ENV === "production" && isPlaceholderSecret(value)) {
    throw new Error(
      `${name} looks like a placeholder — set a real, random secret before production`
    );
  }

  return value;
};

export const getEnvironmentConfig = () => {
  const port = parseInteger("PORT", 5000, { min: 1, max: 65535 });
  const sensorIntervalMs = parseInteger("SENSOR_INTERVAL_MS", 2000, {
    min: 250,
    max: 60000,
  });
  const rateLimitWindowMs = parseInteger("RATE_LIMIT_WINDOW_MS", 900000, {
    min: 1000,
  });
  const rateLimitMax = parseInteger("RATE_LIMIT_MAX", 600, { min: 1 });
  const authRateLimitMax = parseInteger("AUTH_RATE_LIMIT_MAX", 25, { min: 1 });
  const bruteForceWindowMs = parseInteger("BRUTE_FORCE_WINDOW_MS", 900000, {
    min: 1000,
  });
  const bruteForceMaxFailures = parseInteger("BRUTE_FORCE_MAX_FAILURES", 8, {
    min: 1,
  });

  if (!process.env.MONGO_URI) {
    throw new Error("Missing required environment variable: MONGO_URI");
  }

  requireSecret("JWT_SECRET");

  if (process.env.NODE_ENV === "production") {
    requireSecret("JWT_REFRESH_SECRET", { productionOnly: true });

    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN.trim() === "*") {
      throw new Error("CORS_ORIGIN must be an explicit whitelist in production");
    }
  }

  return {
    apiVersion: process.env.API_VERSION || "20.0.0",
    authRateLimitMax,
    allowedOrigins: parseCorsOrigins(process.env.CORS_ORIGIN),
    backupScheduleEnabled: parseBoolean(
      process.env.BACKUP_SCHEDULE_ENABLED,
      false
    ),
    bruteForceMaxFailures,
    bruteForceWindowMs,
    enableSensorSimulation: parseBoolean(
      process.env.ENABLE_SENSOR_SIMULATION,
      false
    ),
    environment: process.env.NODE_ENV || "development",
    port,
    rateLimitMax,
    rateLimitWindowMs,
    sensorIntervalMs,
  };
};
