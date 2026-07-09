const getBearerToken = (authorization = "") => {
  const [scheme, token] = String(authorization).split(" ");
  return scheme?.toLowerCase() === "bearer" ? token : null;
};

export const deviceAuthMiddleware = (req, res, next) => {
  const expectedSecret = process.env.DEVICE_SECRET;

  if (!expectedSecret) {
    return next();
  }

  const suppliedSecret =
    req.get("x-device-secret") ||
    getBearerToken(req.get("authorization")) ||
    req.body?.deviceSecret;

  if (suppliedSecret !== expectedSecret) {
    return res.status(401).json({
      message: "Unauthorized device",
      success: false,
    });
  }

  if (req.body && typeof req.body === "object") {
    delete req.body.deviceSecret;
  }

  next();
};
