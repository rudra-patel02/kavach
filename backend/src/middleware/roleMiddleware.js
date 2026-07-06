import { hasAnyRole } from "../security/rbac.js";

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!hasAnyRole(req.user.role, allowedRoles)) {
        return res.status(403).json({
          success: false,
          message: "Access Denied",
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Permission Check Failed",
      });
    }
  };
};

export default roleMiddleware;
