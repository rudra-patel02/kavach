import mongoose from "mongoose";

import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import Prediction from "../models/Prediction.js";
import ReportSchedule from "../models/reportSchedule.js";
import User from "../models/user.js";
import WorkOrder from "../models/workOrder.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import { buildGlobalSearchResults } from "../services/searchService.js";

export const globalSearch = async (req, res) => {
  try {
    const query = String(req.query.q || req.query.query || "").trim();
    const typeFilter = String(req.query.type || "").trim().toLowerCase();
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

    if (query.length < 2) {
      return res.json({
        pagination: { limit, page, pages: 0, total: 0 },
        success: true,
        query,
        results: [],
      });
    }

    const scopedQuery = buildTenantScopedQuery(req);
    const tenantOnlyQuery = req.tenantContext?.tenantId
      ? { tenantId: req.tenantContext.tenantId }
      : {};
    const organizationIdentity = String(req.tenantContext?.organizationId || "");
    const organizationQuery =
      organizationIdentity && !req.tenantContext.isSuperAdmin
        ? {
            ...tenantOnlyQuery,
            $or: [
              ...(mongoose.isValidObjectId(organizationIdentity)
                ? [{ _id: organizationIdentity }]
                : []),
              { organizationCode: organizationIdentity },
            ],
          }
        : tenantOnlyQuery;
    const userQuery = {
      ...tenantOnlyQuery,
      ...(req.tenantContext?.organizationId && !req.tenantContext?.isSuperAdmin
        ? { organizationId: req.tenantContext.organizationId }
        : {}),
    };
    const [
      organizations,
      plants,
      machines,
      notifications,
      predictions,
      reports,
      workOrders,
      users,
    ] = await Promise.all([
      Organization.find(organizationQuery).sort({ name: 1 }).limit(250).lean(),
      Plant.find(scopedQuery).sort({ name: 1 }).limit(500).lean(),
      Machine.find(scopedQuery).sort({ machineId: 1 }).limit(1000).lean(),
      Notification.find(scopedQuery).sort({ createdAt: -1 }).limit(500).lean(),
      Prediction.find(scopedQuery).sort({ timestamp: -1 }).limit(500).lean(),
      ReportSchedule.find(scopedQuery).sort({ createdAt: -1 }).limit(250).lean(),
      WorkOrder.find(scopedQuery).sort({ createdAt: -1 }).limit(500).lean(),
      User.find(userQuery).select("-password -refreshToken").sort({ name: 1 }).limit(500).lean(),
    ]);

    const allResults = buildGlobalSearchResults({
      organizations,
      plants,
      query,
      machines,
      notifications,
      predictions,
      reports,
      workOrders,
      users,
    });
    const filteredResults = typeFilter
      ? allResults.filter((result) => result.type.toLowerCase() === typeFilter)
      : allResults;
    const start = (page - 1) * limit;
    const results = filteredResults.slice(start, start + limit);

    res.json({
      filters: {
        availableTypes: Array.from(new Set(allResults.map((result) => result.type))).sort(),
        type: typeFilter || null,
      },
      pagination: {
        limit,
        page,
        pages: Math.ceil(filteredResults.length / limit),
        total: filteredResults.length,
      },
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("Global search failed:", error);
    res.status(500).json({
      message: "Failed to run global search",
    });
  }
};
