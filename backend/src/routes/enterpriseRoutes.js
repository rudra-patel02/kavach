import express from "express";

import {
  autoAssignWorkOrder,
  commentOnAlert,
  getCrossPlantAnalytics,
  getEnterpriseAlerts,
  getEnterpriseAudit,
  getEnterpriseDashboard,
  getFleetIntelligence,
  listAreas,
  listAssets,
  listEngineers,
  listNotificationRules,
  listOrganizations,
  listPlants,
  listRegions,
  listReportSchedules,
  listTenants,
  patchAssetLifecycle,
  postArea,
  postAsset,
  postEngineer,
  postNotificationRule,
  postOrganization,
  postPlant,
  postRegion,
  postReportSchedule,
  postTenant,
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

router.get("/tenants", roleMiddleware(["Super Admin", "Admin"]), listTenants);
router.post("/tenants", roleMiddleware(["Super Admin", "Admin"]), postTenant);

router.get("/organizations", roleMiddleware(readRoles), listOrganizations);
router.post("/organizations", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), postOrganization);

router.get("/regions", roleMiddleware(readRoles), listRegions);
router.post("/regions", roleMiddleware(["Super Admin", "Admin", "Organization Admin"]), postRegion);

router.get("/plants", roleMiddleware(readRoles), listPlants);
router.post("/plants", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin"]), postPlant);

router.get("/areas", roleMiddleware(readRoles), listAreas);
router.post("/areas", roleMiddleware(manageRoles), postArea);

router.get("/assets", roleMiddleware(readRoles), listAssets);
router.post("/assets", roleMiddleware(manageRoles), postAsset);
router.patch("/assets/:assetId/lifecycle", roleMiddleware(manageRoles), patchAssetLifecycle);

router.get("/engineers", roleMiddleware(readRoles), listEngineers);
router.post("/engineers", roleMiddleware(manageRoles), postEngineer);
router.post("/workorders/:workOrderId/auto-assign", roleMiddleware(manageRoles), autoAssignWorkOrder);

router.get("/alerts", roleMiddleware(readRoles), getEnterpriseAlerts);
router.post("/alerts/:id/comments", roleMiddleware(manageRoles), commentOnAlert);

router.get("/notification-rules", roleMiddleware(readRoles), listNotificationRules);
router.post("/notification-rules", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), postNotificationRule);

router.get("/report-schedules", roleMiddleware(readRoles), listReportSchedules);
router.post("/report-schedules", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager"]), postReportSchedule);

router.get("/audit", roleMiddleware(["Super Admin", "Admin", "Organization Admin", "Plant Admin", "Plant Manager", "Maintenance Manager"]), getEnterpriseAudit);

export default router;
