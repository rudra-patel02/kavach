export const ROLE_ALIASES = {
  Admin: "Super Admin",
  Engineer: "Engineer",
  "Maintenance Engineer": "Engineer",
  "Maintenance Manager": "Maintenance Manager",
  "Organization Admin": "Organization Admin",
  "Plant Admin": "Plant Admin",
  "Plant Manager": "Plant Admin",
  "Super Admin": "Super Admin",
  Operator: "Operator",
  Viewer: "Viewer",
};

export const ENTERPRISE_ROLES = [
  "Super Admin",
  "Organization Admin",
  "Plant Admin",
  "Maintenance Manager",
  "Engineer",
  "Operator",
  "Viewer",
];

export const ROLE_PERMISSIONS = {
  "Super Admin": ["*"],
  "Plant Admin": [
    "analytics:read",
    "audit:read",
    "backup:read",
    "config:write",
    "devices:manage",
    "machines:manage",
    "plants:manage",
    "reports:read",
    "system:read",
    "users:manage",
    "workorders:manage",
  ],
  "Organization Admin": [
    "analytics:read",
    "audit:read",
    "backup:read",
    "config:write",
    "devices:manage",
    "enterprise:manage",
    "machines:manage",
    "notifications:manage",
    "plants:manage",
    "reports:read",
    "system:read",
    "users:manage",
    "workorders:manage",
  ],
  "Maintenance Manager": [
    "analytics:read",
    "audit:read",
    "devices:read",
    "machines:manage",
    "reports:read",
    "workorders:manage",
  ],
  Engineer: [
    "analytics:read",
    "devices:read",
    "machines:manage",
    "reports:read",
    "workorders:manage",
  ],
  Operator: [
    "analytics:read",
    "devices:read",
    "machines:read",
    "reports:read",
    "workorders:read",
  ],
  Viewer: [
    "analytics:read",
    "devices:read",
    "machines:read",
    "reports:read",
    "workorders:read",
  ],
};

export const normalizeRole = (role) => ROLE_ALIASES[role] || role || "Viewer";

export const getPermissionsForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.Viewer;
};

export const hasPermission = (role, permission) => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes("*") || permissions.includes(permission);
};

export const hasAnyRole = (role, allowedRoles = []) => {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (normalizedAllowedRoles.includes(normalizedRole)) {
    return true;
  }

  if (
    normalizedRole === "Maintenance Manager" &&
    normalizedAllowedRoles.includes("Engineer")
  ) {
    return true;
  }

  if (
    normalizedRole === "Organization Admin" &&
    normalizedAllowedRoles.includes("Plant Admin")
  ) {
    return true;
  }

  return false;
};

export const canAccessPlant = (user = {}, plantId) => {
  if (!plantId || normalizeRole(user.role) === "Super Admin") {
    return true;
  }

  const plantIds = Array.isArray(user.plantIds) ? user.plantIds.map(String) : [];
  return plantIds.length === 0 || plantIds.includes(String(plantId));
};
