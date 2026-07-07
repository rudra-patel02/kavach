import jwt from "jsonwebtoken";

import { createAuditLog } from "../services/auditService.js";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      void createAuditLog({
        action: "AUTH_TOKEN_MISSING",
        metadata: { path: req.originalUrl },
        req,
        resourceType: "auth",
        severity: "Warning",
        status: "failure",
      });

      return res.status(401).json({
        success: false,
        message: "Access token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    // Pin the algorithm so an attacker can't swap to "none" or an asymmetric alg.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    req.user = decoded;

    return next();
  } catch (error) {
    void createAuditLog({
      action: "AUTH_TOKEN_INVALID",
      metadata: { path: req.originalUrl, reason: error.message },
      req,
      resourceType: "auth",
      severity: "Warning",
      status: "failure",
    });

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authMiddleware;
