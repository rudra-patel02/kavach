import Machine from "../models/machine.js";
import Notification from "../models/notification.js";
import WorkOrder from "../models/workOrder.js";
import { buildReport, REPORT_TYPES } from "../services/reportService.js";

const loadReportData = async () => {
  const [machines, notifications, workOrders] = await Promise.all([
    Machine.find().sort({ machineId: 1 }).lean(),
    Notification.find().sort({ createdAt: -1 }).limit(500).lean(),
    WorkOrder.find().sort({ createdAt: -1 }).limit(500).lean(),
  ]);

  return {
    machines,
    notifications,
    workOrders,
  };
};

const getFilename = (report) =>
  `${report.reportId.replace(/[^A-Z0-9-]/gi, "-")}.pdf`;

export const generateReport = async (req, res) => {
  try {
    const type = String(req.body?.type || req.params.type || "maintenance");
    const format = String(req.body?.format || req.query.format || "json").toLowerCase();
    const data = await loadReportData();
    const report = buildReport({ type, ...data });

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${getFilename(report)}"`
      );
      return res.send(report.pdf);
    }

    res.json({
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
    const data = await loadReportData();
    const report = buildReport({ type, ...data });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${getFilename(report)}"`
    );
    return res.send(report.pdf);
  } catch (error) {
    console.error("PDF report generation failed:", error);
    res.status(500).json({
      message: "Failed to generate PDF report",
    });
  }
};
