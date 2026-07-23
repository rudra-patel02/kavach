import ReportDeliveryLog from "../models/reportDeliveryLog.js";
import ReportSchedule from "../models/reportSchedule.js";
import { buildReport } from "./reportService.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getNextRunAt = (fromDate = new Date(), frequency = "weekly") => {
  const date = new Date(fromDate);
  const increments = {
    daily: 1,
    monthly: 30,
    weekly: 7,
  };

  date.setTime(date.getTime() + (increments[frequency] || 7) * MS_PER_DAY);
  return date;
};

export const buildReportDeliverySummary = ({ report, machines = [], notifications = [], workOrders = [] }) => ({
  generatedAt: report.generatedAt,
  lineCount: report.lines.length,
  machines: machines.length,
  notifications: notifications.length,
  reportId: report.reportId,
  workOrders: workOrders.length,
});

export const runReportSchedule = async (schedule, data = {}) => {
  const report = buildReport({
    machines: data.machines || [],
    notifications: data.notifications || [],
    type: schedule.reportType || "automated-executive",
    workOrders: data.workOrders || [],
  });
  const deliveryLog = await ReportDeliveryLog.create({
    format: schedule.format || "pdf",
    organizationId: schedule.organizationId || "",
    plantId: schedule.plantId || "",
    recipients: schedule.recipients || [],
    reportId: report.reportId,
    reportType: report.type,
    scheduleId: String(schedule._id || schedule.id),
    status: "delivered",
    summary: buildReportDeliverySummary({
      machines: data.machines,
      notifications: data.notifications,
      report,
      workOrders: data.workOrders,
    }),
    tenantId: schedule.tenantId || "",
    deliveredAt: new Date(),
  });

  schedule.lastRunAt = new Date();
  schedule.nextRunAt = getNextRunAt(schedule.lastRunAt, schedule.frequency);
  await schedule.save?.();

  return {
    deliveryLog,
    report,
    schedule,
  };
};

export const findDueReportSchedules = (query = {}) =>
  ReportSchedule.find({
    ...query,
    enabled: true,
    nextRunAt: { $lte: new Date() },
  }).sort({ nextRunAt: 1 });
