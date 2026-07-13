import crypto from "node:crypto";

import { ensureSeededAdminUser } from "../services/adminUserService.js";

let repairCompleted = false;

export const getAdminRepairKeyFromRequest = (req) => {
  const authorization = String(req.headers.authorization || "");

  if (authorization.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return String(req.headers["x-admin-repair-key"] || req.body?.repairKey || "");
};

export const validateAdminRepairKey = (providedKey) => {
  const expectedKey = process.env.ADMIN_REPAIR_KEY;

  if (!expectedKey || !providedKey) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedKey);
  const providedBuffer = Buffer.from(providedKey);

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
};

export const repairSeedAdmin = async (req, res) => {
  if (repairCompleted) {
    return res.status(410).json({
      success: false,
      message: "Admin repair has already completed for this server process",
    });
  }

  if (!process.env.ADMIN_REPAIR_KEY) {
    return res.status(503).json({
      success: false,
      message: "Admin repair is not configured",
    });
  }

  if (!validateAdminRepairKey(getAdminRepairKeyFromRequest(req))) {
    return res.status(403).json({
      success: false,
      message: "Invalid admin repair key",
    });
  }

  const result = await ensureSeededAdminUser();
  repairCompleted = true;

  return res.json({
    success: true,
    admin: {
      email: result.email,
      passwordUpdated: result.passwordUpdated,
      storedPasswordIsBcrypt: result.storedPasswordIsBcrypt,
      userId: result.userId,
    },
  });
};
