import express from "express";

import {
  autoAssignWorkOrder,
  commentOnAlert,
  assignUserRole,
  completeOnboarding,
  deleteOrganization,
  deletePlant,
  generateEnterpriseDemo,
  getCrossPlantAnalytics,
  getDemoConfiguration,
  getEnterpriseAlerts,
  getEnterpriseAudit,
  getEnterpriseDashboard,
  getFleetIntelligence,
  getGlobalAdminConsole,
  getOnboardingProgress,
  getOrganization,
  getPlant,
  listAreas,
  listAssets,
  listEngineers,
  listInvitations,
  listNotificationRules,
  listOrganizations,
  listPlants,
  listRegions,
  listReportSchedules,
  listTenants,
  patchAssetLifecycle,
  patchOnboardingProgress,
  patchOrganization,
  patchOrganizationBranding,
  patchOrganizationSettings,
  patchPlant,
  postArea,
  postAsset,
  postEngineer,
  postInvitation,
  postNotificationRule,
  postOrganization,
  postPlant,
  postRegion,
  postReportSchedule,
  postTenant,
  resetEnterpriseDemo,
  revokeInvitation,
} from "../controllers/enterpriseController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

const readRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
  "Operator",
  "Viewer",
];

const manageRoles = [
  "Super Admin",
  "Admin",
  "Organization Admin",
  "Plant Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Engineer",
  "Maintenance Engineer",
];

router.use(authMiddleware);

router.get("/dashboard", roleMiddleware(readRoles), getEnterpriseDashboard);
router.get("/fleet", roleMiddleware(readRoles), getFleetIntelligence);
router.get("/analytics/cross-plant", roleMiddleware(readRoles), getCrossPlantAnalytics);
router.get("/admin/console", roleMiddleware(["Super Admin", "Admin"]), getGlobalAdminConsole);

router.get("/tenants", roleMiddleware(["Super Admin", "Admin"]), listTenants);
router.post("/tenants", roleMiddleware(["Super Admin", "Admin"]), postTenant);

router.get("/organizations", roleMiddleware(readRoles), listOrganizations);
router.post("/organizations", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), postOrganization);
router.get("/organizations/:id", roleMiddleware(readRoles), getOrganization);
router.patch("/organizations/:id", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), patchOrganization);
router.put("/organizations/:id", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), patchOrganization);
router.delete("/organizations/:id", roleMiddleware(["Super Admin", "Admin"]), deleteOrganization);
router.patch("/organizations/:id/settings", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), patchOrganizationSettings);
router.patch("/organizations/:id/branding", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), patchOrganizationBranding);
router.get("/organizations/:id/invitations", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), listInvitations);
router.post("/organizations/:id/invitations", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), postInvitation);

router.get("/regions", roleMiddleware(readRoles), listRegions);
router.post("/regions", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), postRegion);

router.get("/plants", roleMiddleware(readRoles), listPlants);
router.post("/plants", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), postPlant);
router.get("/plants/:id", roleMiddleware(readRoles), getPlant);
router.patch("/plants/:id", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), patchPlant);
router.put("/plants/:id", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), patchPlant);
router.delete("/plants/:id", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), deletePlant);

router.get("/areas", roleMiddleware(readRoles), listAreas);
router.post("/areas", roleMiddleware(manageRoles), postArea);

router.get("/assets", roleMiddleware(readRoles), listAssets);
router.post("/assets", roleMiddleware(manageRoles), postAsset);
router.patch("/assets/:assetId/lifecycle", roleMiddleware(manageRoles), patchAssetLifecycle);

router.get("/engineers", roleMiddleware(readRoles), listEngineers);
router.post("/engineers", roleMiddleware(manageRoles), postEngineer);
router.patch("/users/:userId/role", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), assignUserRole);
router.get("/invitations", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), listInvitations);
router.post("/invitations", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), postInvitation);
router.patch("/invitations/:invitationId/revoke", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), revokeInvitation);
router.post("/workorders/:workOrderId/auto-assign", roleMiddleware(manageRoles), autoAssignWorkOrder);

router.get("/alerts", roleMiddleware(readRoles), getEnterpriseAlerts);
router.post("/alerts/:id/comments", roleMiddleware(manageRoles), commentOnAlert);

router.get("/notification-rules", roleMiddleware(readRoles), listNotificationRules);
router.post("/notification-rules", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), postNotificationRule);

router.get("/report-schedules", roleMiddleware(readRoles), listReportSchedules);
router.post("/report-schedules", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), postReportSchedule);

router.get("/audit", roleMiddleware(readRoles), getEnterpriseAudit);

router.get("/onboarding/:organizationId", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), getOnboardingProgress);
router.patch("/onboarding/:organizationId", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), patchOnboardingProgress);
router.post("/onboarding/:organizationId/complete", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), completeOnboarding);
router.get("/onboarding", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), getOnboardingProgress);
router.patch("/onboarding", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), patchOnboardingProgress);
router.post("/onboarding/complete", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), completeOnboarding);

router.get("/demo/configuration", roleMiddleware(["Super Admin", "Admin"]), getDemoConfiguration);
router.post("/demo/generate", roleMiddleware(["Super Admin", "Admin"]), generateEnterpriseDemo);
router.post("/demo/reset", roleMiddleware(["Super Admin", "Admin"]), resetEnterpriseDemo);

export default router;
