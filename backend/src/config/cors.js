const CORS_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const CORS_ALLOWED_HEADERS = ["Content-Type", "Authorization"];

export const normalizeOrigin = (origin) => {
  const value = String(origin || "").trim().replace(/\/+$/, "");

  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

export const buildCorsOptions = (
  allowedOrigins,
  { credentials = true } = {}
) => {
  const allowAnyOrigin = allowedOrigins === "*";

  return {
    origin:
      allowAnyOrigin
      ? "*"
      : (origin, callback) => {
          if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
            callback(null, true);
          } else {
            callback(new Error("Origin is not allowed by CORS"));
          }
        },
    methods: CORS_METHODS,
    allowedHeaders: CORS_ALLOWED_HEADERS,
    credentials: allowAnyOrigin ? false : credentials,
    maxAge: 86400,
    optionsSuccessStatus: 204,
  };
};
