import { normalizeRole } from "../security/rbac.js";

const normalizeValue = (value) => String(value || "").trim();

export const tenantContext = (req, res, next) => {
  const user = req.user || {};
  const tenantId =
    normalizeValue(user.tenantId) ||
    normalizeValue(req.headers["x-tenant-id"]) ||
    normalizeValue(req.query?.tenantId) ||
    normalizeValue(req.body?.tenantId);
  const organizationId =
    normalizeValue(user.organizationId) ||
    normalizeValue(req.headers["x-organization-id"]) ||
    normalizeValue(req.query?.organizationId) ||
    normalizeValue(req.body?.organizationId);
  const requestedPlantId =
    normalizeValue(req.headers["x-plant-id"]) ||
    normalizeValue(req.query?.plantId) ||
    normalizeValue(req.body?.plantId);
  const activePlantId = normalizeValue(user.activePlantId);
  const userPlantIds = Array.isArray(user.plantIds)
    ? user.plantIds.map(String).filter(Boolean)
    : [];
  const role = normalizeRole(user.role);

  req.tenantContext = {
    activePlantId,
    isSuperAdmin: role === "Super Admin",
    organizationId,
    plantId: requestedPlantId || activePlantId,
    plantIds: userPlantIds,
    tenantId,
  };

  next();
};

export const buildTenantScopedQuery = (req, baseQuery = {}) => {
  const context = req.tenantContext || {};
  const query = { ...baseQuery };

  if (context.tenantId && !query.tenantId) {
    query.tenantId = context.tenantId;
  }

  if (context.organizationId && !query.organizationId) {
    query.organizationId = context.organizationId;
  }

  if (context.plantId && !query.plantId) {
    query.plantId = context.plantId;
  } else if (
    !context.isSuperAdmin &&
    Array.isArray(context.plantIds) &&
    context.plantIds.length > 0 &&
    !query.plantId
  ) {
    query.plantId = { $in: context.plantIds };
  }

  return query;
};
