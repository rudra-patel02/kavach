import { canAccessPlant, hasPermission } from "../security/rbac.js";

const hasExplicitPermission = (user, permission) => {
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const permissionMiddleware = (permission) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }

  if (!hasExplicitPermission(req.user, permission) && !hasPermission(req.user.role, permission)) {
    return res.status(403).json({
      message: "Permission denied",
      permission,
      success: false,
    });
  }

  next();
};

// Allows the request if the caller holds ANY of the listed permissions. Useful
// where a coarse permission (e.g. workorders:manage) should imply a finer one
// (workorders:read) without duplicating grants in the role map.
export const anyPermissionMiddleware = (permissions = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
      success: false,
    });
  }

  const allowed = permissions.some(
    (permission) =>
      hasExplicitPermission(req.user, permission) ||
      hasPermission(req.user.role, permission)
  );

  if (!allowed) {
    return res.status(403).json({
      message: "Permission denied",
      permissions,
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
