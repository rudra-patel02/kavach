import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import WorkOrder from "../models/workOrder.js";
import { buildExecutiveDashboard } from "./executiveAnalyticsService.js";
import { serializeNotification } from "./notificationService.js";
import { buildPredictiveOverview } from "./predictionService.js";
import { serializeWorkOrder } from "./workOrderService.js";

export const loadCopilotContext = async () => {
  const [machines, notifications, workOrders] = await Promise.all([
    Machine.find().sort({ machineId: 1 }).lean(),
    Notification.find().sort({ createdAt: -1 }).limit(100).lean(),
    WorkOrder.find().sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  const predictiveOverview = buildPredictiveOverview(machines);
  const executiveDashboard = buildExecutiveDashboard({
    machines,
    notifications,
    workOrders,
  });

  return {
    machines,
    notifications: notifications.map(serializeNotification),
    workOrders: workOrders.map(serializeWorkOrder),
    predictiveOverview,
    executiveDashboard,
  };
};
