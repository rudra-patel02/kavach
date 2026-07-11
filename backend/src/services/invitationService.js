import crypto from "node:crypto";

import UserInvitation from "../models/userInvitation.js";
import { getPermissionsForRole, normalizeRole } from "../security/rbac.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const hashInvitationToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

export const createInvitationToken = () => crypto.randomBytes(32).toString("base64url");

export const serializeInvitation = (invitation, includeToken = false) => {
  const value =
    invitation && typeof invitation.toObject === "function"
      ? invitation.toObject()
      : invitation;

  if (!value) {
    return null;
  }

  const { tokenHash, token, ...safeInvitation } = value;

  return {
    ...safeInvitation,
    _id: value._id ? String(value._id) : undefined,
    acceptedAt: value.acceptedAt ? new Date(value.acceptedAt).toISOString() : null,
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : null,
    expiresAt: value.expiresAt ? new Date(value.expiresAt).toISOString() : null,
    revokedAt: value.revokedAt ? new Date(value.revokedAt).toISOString() : null,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : null,
    ...(includeToken && token ? { token } : {}),
  };
};

export const buildInvitationFilter = ({ req, organizationId, status } = {}) => {
  const filter = {};
  const context = req?.tenantContext || {};

  if (context.tenantId) {
    filter.tenantId = context.tenantId;
  }

  if (organizationId || context.organizationId) {
    filter.organizationId = String(organizationId || context.organizationId);
  }

  if (status) {
    filter.status = status;
  }

  return filter;
};

export const createUserInvitation = async ({ payload = {}, req } = {}) => {
  const email = normalizeEmail(payload.email);

  if (!isValidEmail(email)) {
    const error = new Error("A valid invitee email is required");
    error.statusCode = 400;
    throw error;
  }

  const role = normalizeRole(payload.role || "Viewer");
  const token = createInvitationToken();
  const expiresAt = payload.expiresAt
    ? new Date(payload.expiresAt)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    const error = new Error("Invitation expiry must be a future date");
    error.statusCode = 400;
    throw error;
  }

  const invitation = await UserInvitation.create({
    email,
    expiresAt,
    invitedBy: req?.user?.email || req?.user?.name || "KAVACH Admin",
    metadata: payload.metadata || {},
    name: String(payload.name || "").trim(),
    organizationId:
      payload.organizationId || req?.tenantContext?.organizationId || req?.user?.organizationId || "",
    permissions: Array.isArray(payload.permissions)
      ? payload.permissions
      : getPermissionsForRole(role),
    plantIds: Array.isArray(payload.plantIds)
      ? payload.plantIds.map(String)
      : req?.user?.plantIds || [],
    role,
    tenantId: payload.tenantId || req?.tenantContext?.tenantId || req?.user?.tenantId || "",
    tokenHash: hashInvitationToken(token),
  });

  return serializeInvitation({ ...invitation.toObject(), token }, true);
};

export const revokeUserInvitation = async ({ id, req }) => {
  const invitation = await UserInvitation.findOneAndUpdate(
    {
      ...buildInvitationFilter({ req }),
      _id: id,
      status: "Pending",
    },
    {
      revokedAt: new Date(),
      status: "Revoked",
    },
    { new: true }
  );

  return serializeInvitation(invitation);
};
