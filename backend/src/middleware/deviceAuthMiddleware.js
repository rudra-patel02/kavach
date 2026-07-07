import { verifyDeviceSecret } from "../services/ingest.js";

const getBearerToken = (authorization = "") => {
  const [scheme, token] = String(authorization).split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
};

// Fail CLOSED. verifyDeviceSecret returns false when DEVICE_SECRET is unset, so
// there is no configuration in which an unauthenticated device is accepted.
export const deviceAuthMiddleware = (req, res, next) => {
  const suppliedSecret =
    req.get("x-device-secret") ||
    getBearerToken(req.get("authorization")) ||
    req.body?.deviceSecret;

  if (!verifyDeviceSecret(suppliedSecret)) {
    return res.status(401).json({
      message: "Unauthorized device",
      success: false,
    });
  }

  // Never let the secret flow downstream into storage/logs.
  if (req.body && typeof req.body === "object") {
    delete req.body.deviceSecret;
  }

  next();
};

export default deviceAuthMiddleware;
