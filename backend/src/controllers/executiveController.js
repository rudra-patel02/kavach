import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import WorkOrder from "../models/workOrder.js";
import { buildExecutiveDashboard } from "../services/executiveAnalyticsService.js";

export const getExecutiveDashboard = async (req, res) => {
  try {
    const [
      machines,
      notifications,
      workOrders,
      machineSummary,
      departmentSummary,
      statusSummary,
      notificationSummary,
      workOrderSummary,
    ] = await Promise.all([
      Machine.find().sort({ machineId: 1 }).lean(),
      Notification.find().sort({ createdAt: -1 }).limit(500).lean(),
      WorkOrder.find().sort({ createdAt: -1 }).limit(500).lean(),
      Machine.aggregate([
        {
          $group: {
            _id: null,
            totalMachines: { $sum: 1 },
            averageHealth: { $avg: "$health" },
            averageEfficiency: { $avg: "$efficiency" },
            totalEnergy: { $sum: "$energyConsumed" },
          },
        },
      ]),
      Machine.aggregate([
        {
          $group: {
            _id: "$department",
            machines: { $sum: 1 },
            averageHealth: { $avg: "$health" },
            averageEfficiency: { $avg: "$efficiency" },
            totalEnergy: { $sum: "$energyConsumed" },
          },
        },
        { $sort: { totalEnergy: -1 } },
      ]),
      Machine.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Notification.aggregate([
        {
          $group: {
            _id: "$severity",
            count: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$read", false] }, 1, 0],
              },
            },
          },
        },
      ]),
      WorkOrder.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            downtime: { $sum: "$estimatedDowntimeHours" },
            repairCost: { $sum: "$estimatedRepairCost" },
          },
        },
      ]),
    ]);

    const dashboard = buildExecutiveDashboard({
      machines,
      notifications,
      workOrders,
      aggregates: {
        machineSummary: machineSummary[0] || null,
        departmentSummary,
        statusSummary,
        notificationSummary,
        workOrderSummary,
      },
    });

    res.json({
      success: true,
      dashboard,
      ...dashboard.plantKpis,
      ...dashboard.machineSummary,
    });
  } catch (error) {
    console.error("Executive dashboard failed:", error);
    res.status(500).json({
      message: "Failed to load executive dashboard",
    });
  }
};
