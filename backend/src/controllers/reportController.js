import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import ReportDeliveryLog from "../models/reportDeliveryLog.js";
import WorkOrder from "../models/workOrder.js";
import { buildTenantScopedQuery } from "../middleware/tenantMiddleware.js";
import {
  buildReport,
  reportToCsv,
  reportToExcelHtml,
  REPORT_TYPES,
} from "../services/reportService.js";
import {
  findDueReportSchedules,
  runReportSchedule,
} from "../services/reportAutomationService.js";
import { createAuditLog } from "../services/auditService.js";

const loadReportData = async (req) => {
  const scopedQuery = buildTenantScopedQuery(req);
  const [machines, notifications, workOrders] = await Promise.all([
    Machine.find(scopedQuery).sort({ machineId: 1 }).lean(),
    Notification.find(scopedQuery).sort({ createdAt: -1 }).limit(500).lean(),
    WorkOrder.find(scopedQuery).sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return {
    machines,
    notifications,
    workOrders,
  };
};

const getFilename = (report) =>
  `${report.reportId.replace(/[^A-Z0-9-]/gi, "-")}.pdf`;

const sendReport = async ({ format, report, req, res }) => {
  await createAuditLog({
    action: "REPORT_GENERATED",
    metadata: { format, type: report.type },
    req,
    resourceId: report.reportId,
    resourceType: "report",
  });

  if (format === "pdf") {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getFilename(report)}"`
    );
    return res.send(report.pdf);
  }

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.reportId}.csv"`
    );
    return res.send(reportToCsv(report));
  }

  if (format === "excel" || format === "xls") {
    res.setHeader("Content-Type", "application/vnd.ms-excel; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.reportId}.xls"`
    );
    return res.send(reportToExcelHtml(report));
  }

  return res.json({
    success: true,
    availableTypes: REPORT_TYPES,
    report: {
      reportId: report.reportId,
      type: report.type,
      title: report.title,
      generatedAt: report.generatedAt,
      sections: report.lines,
    },
  });
};

export const getReportCatalog = (req, res) => {
  res.json({
    formats: ["json", "pdf", "csv", "excel"],
    interactiveCharts: [
      "riskDistribution",
      "departmentEnergy",
      "workOrderStatus",
      "oeeTrend",
    ],
    periods: ["daily", "weekly", "monthly", "quarterly"],
    scheduledDelivery: {
      endpoint: "/api/enterprise/report-schedules",
      supportsEmailDelivery: true,
      supportsAutomatedExecutiveReports: true,
    },
    automation: {
      defaultExecutiveType: "automated-executive",
      endpoint: "/api/reports/automated-executive",
      scheduleEndpoint: "/api/enterprise/report-schedules",
    },
    success: true,
    types: REPORT_TYPES,
  });
};

export const generateReport = async (req, res) => {
  try {
    const type = String(req.body?.type || req.params.type || "maintenance");
    const format = String(req.body?.format || req.query.format || "json").toLowerCase();
    const data = await loadReportData(req);
    const report = buildReport({ type, ...data });

    return sendReport({ format, report, req, res });
  } catch (error) {
    console.error("Report generation failed:", error);
    res.status(500).json({
      message: "Failed to generate report",
    });
  }
};

export const downloadReportPdf = async (req, res) => {
  try {
    const type = String(req.params.type || "maintenance");
    const data = await loadReportData(req);
    const report = buildReport({ type, ...data });

    return sendReport({ format: "pdf", report, req, res });
  } catch (error) {
    console.error("PDF report generation failed:", error);
    res.status(500).json({
      message: "Failed to generate PDF report",
    });
  }
};

export const getReportAutomationStatus = async (req, res) => {
  try {
    const [recentDeliveries, failedCount] = await Promise.all([
      ReportDeliveryLog.find(buildTenantScopedQuery(req))
        .sort({ generatedAt: -1 })
        .limit(25)
        .lean(),
      ReportDeliveryLog.countDocuments(
        buildTenantScopedQuery(req, { status: "failed" })
      ),
    ]);

    res.json({
      success: true,
      automation: {
        failedCount,
        recentDeliveries,
        supportedFormats: ["pdf", "excel", "csv", "json"],
        supportedTypes: REPORT_TYPES,
      },
    });
  } catch (error) {
    console.error("Report automation status failed:", error);
    res.status(500).json({ message: "Failed to load report automation status" });
  }
};

export const runDueReportSchedules = async (req, res) => {
  try {
    const data = await loadReportData(req);
    const dueSchedules = await findDueReportSchedules(buildTenantScopedQuery(req));
    const results = [];

    for (const schedule of dueSchedules) {
      const result = await runReportSchedule(schedule, data);
      results.push({
        deliveryId: String(result.deliveryLog._id),
        reportId: result.report.reportId,
        scheduleId: String(schedule._id),
        nextRunAt: schedule.nextRunAt,
      });
    }

    await createAuditLog({
      action: "REPORT_AUTOMATION_RUN",
      metadata: { schedulesRun: results.length },
      req,
      resourceType: "reportAutomation",
    });

    res.json({
      results,
      success: true,
    });
  } catch (error) {
    console.error("Report automation run failed:", error);
    res.status(500).json({ message: "Failed to run report automation" });
  }
};
