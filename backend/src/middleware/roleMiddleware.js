const roleAliases = {
  Admin: "Super Admin",
  "Super Admin": "Super Admin",
};

const normalizeRole = (role) => roleAliases[role] || role;

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
      const normalizedUserRole = normalizeRole(req.user.role);

      if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
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
