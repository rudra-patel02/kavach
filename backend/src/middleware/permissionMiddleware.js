import { canAccessPlant, hasPermission } from "../security/rbac.js";

export const permissionMiddleware = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }

  if (!hasPermission(req.user.role, permission)) {
    return res.status(403).json({
      message: "Permission denied",
      permission,
      success: false,
    });
  }

  next();
};

export const plantAccessMiddleware = (getPlantId = (req) => req.params.plantId) => (
  req,
  res,
  next
) => {
  const plantId = getPlantId(req);

  if (!canAccessPlant(req.user, plantId)) {
    return res.status(403).json({
      message: "Plant access denied",
      success: false,
    });
  }

  next();
};
