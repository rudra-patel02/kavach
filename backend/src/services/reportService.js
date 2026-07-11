import { buildCopilotReport } from "./copilotAnalysisService.js";
import { buildExecutiveDashboard } from "./executiveAnalyticsService.js";
import { buildPredictiveOverview } from "./predictionService.js";

export const REPORT_TYPES = {
  daily: "Daily Operations Report",
  weekly: "Weekly Report",
  monthly: "Monthly Report",
  quarterly: "Quarterly Report",
  machine: "Machine Report",
  maintenance: "Maintenance Report",
  production: "Production Report",
  downtime: "Downtime Report",
  energy: "Energy Report",
  oee: "OEE Report",
  prediction: "Prediction Report",
  executive: "Executive Report",
  "executive-summary": "Executive Summary Report",
  "plant-health": "Plant Health Report",
};

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const getEnergy = (machine) =>
  Number.isFinite(Number(machine.energyConsumed))
    ? Number(machine.energyConsumed)
    : Number(machine.power || 0);

const getEnergyCostRate = () => Number(process.env.ENERGY_COST_PER_KWH || 0.12);
const getCarbonFactor = () => Number(process.env.CARBON_KG_PER_KWH || 0.42);

const createBar = (value, max, width = 24) => {
  const filled = max > 0 ? Math.round((Number(value) / max) * width) : 0;
  return `${"#".repeat(Math.max(0, filled))}${".".repeat(Math.max(0, width - filled))}`;
};

const buildDepartmentEnergy = (machines) =>
  Object.values(
    machines.reduce((acc, machine) => {
      const department = machine.department || "Production";

      acc[department] ||= {
        department,
        energy: 0,
        machines: 0,
      };
      acc[department].energy += getEnergy(machine);
      acc[department].machines += 1;

      return acc;
    }, {})
  )
    .map((item) => ({
      ...item,
      energy: round(item.energy, 1),
      cost: round(item.energy * getEnergyCostRate(), 2),
      carbonKg: round(item.energy * getCarbonFactor(), 1),
    }))
    .sort((a, b) => b.energy - a.energy);

const buildReportLines = ({ type, machines, notifications, workOrders }) => {
  const title = REPORT_TYPES[type] || REPORT_TYPES.maintenance;
  const predictiveOverview = buildPredictiveOverview(machines);
  const copilotReport = buildCopilotReport(machines);
  const executiveDashboard = buildExecutiveDashboard({
    machines,
    notifications,
    workOrders,
  });
  const departmentEnergy = buildDepartmentEnergy(machines);
  const maxDepartmentEnergy = Math.max(1, ...departmentEnergy.map((item) => item.energy));
  const highRiskMachines = predictiveOverview.predictions.filter((machine) =>
    ["High", "Critical"].includes(machine.riskLevel)
  );

  return [
    "KAVACH Industrial Decision Intelligence Platform",
    title,
    `Generated At: ${new Date().toISOString()}`,
    `Company: ${process.env.COMPANY_NAME || "KAVACH Industrial Operations"}`,
    "",
    "AI Summary",
    `Plant health is ${predictiveOverview.summary.machineHealth}% with ${predictiveOverview.summary.highRiskMachines} high-risk machines. OEE is ${executiveDashboard.kpis.oee}%, downtime is ${executiveDashboard.kpis.downtime} hours, and total energy is ${executiveDashboard.kpis.totalEnergy} kWh.`,
    "",
    "Executive KPIs",
    `OEE: ${executiveDashboard.kpis.oee}%`,
    `MTBF: ${executiveDashboard.kpis.mtbf} hours`,
    `MTTR: ${executiveDashboard.kpis.mttr} hours`,
    `Availability: ${executiveDashboard.kpis.availability}%`,
    `Performance: ${executiveDashboard.kpis.performance}%`,
    `Quality: ${executiveDashboard.kpis.quality}%`,
    `Energy Cost: $${executiveDashboard.kpis.energyCost}`,
    `Carbon Emission: ${executiveDashboard.kpis.carbonEmissionKg} kg CO2e`,
    `Production Rate: ${executiveDashboard.kpis.productionRate} units/shift`,
    `Machine Utilization: ${executiveDashboard.kpis.machineUtilization}%`,
    "",
    "Risk Distribution Chart",
    ...Object.entries(predictiveOverview.summary.riskDistribution).map(
      ([risk, count]) => `${risk.padEnd(8)} ${createBar(count, machines.length)} ${count}`
    ),
    "",
    "Department Energy Chart",
    ...departmentEnergy.map(
      (item) =>
        `${item.department.padEnd(14)} ${createBar(item.energy, maxDepartmentEnergy)} ${item.energy} kWh | $${item.cost} | ${item.carbonKg} kg CO2e`
    ),
    "",
    "Machine Table",
    "ID     Name                  Dept          Status     Health  Fail%  RUL(h)  Priority",
    ...predictiveOverview.predictions.slice(0, 15).map((machine) =>
      `${machine.machineId.padEnd(6)} ${machine.name.slice(0, 20).padEnd(21)} ${machine.department.slice(0, 12).padEnd(13)} ${machine.status.padEnd(10)} ${String(machine.machineHealth).padEnd(7)} ${String(machine.failureProbability).padEnd(6)} ${String(machine.remainingUsefulLifeHours).padEnd(7)} ${machine.maintenancePriority}`
    ),
    "",
    "Maintenance Recommendations",
    ...(highRiskMachines.length
      ? highRiskMachines.slice(0, 8).map(
          (machine, index) =>
            `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.riskLevel}. Root cause: ${machine.probableCause} Recommendation: ${machine.recommendation}`
        )
      : ["No high-risk machine requires immediate intervention."]),
    "",
    "Alert Table",
    "Severity   Machine       Priority  Engineer",
    ...notifications.slice(0, 10).map(
      (notification) =>
        `${String(notification.severity || "").padEnd(10)} ${String(notification.machineId || "").padEnd(13)} ${String(notification.priority || "P4").padEnd(9)} ${notification.recommendedEngineer || "Unassigned"}`
    ),
    "",
    "Work Order Table",
    "ID                Machine       Status        Priority  Downtime",
    ...workOrders.slice(0, 10).map(
      (workOrder) =>
        `${String(workOrder.workOrderId || "").padEnd(17)} ${String(workOrder.machineId || "").padEnd(13)} ${String(workOrder.status || "").padEnd(13)} ${String(workOrder.priority || "").padEnd(9)} ${workOrder.estimatedDowntimeHours || 0}h`
    ),
    "",
    "AI Copilot Schedule",
    ...copilotReport.maintenanceSchedule.slice(0, 8).map(
      (item, index) =>
        `${index + 1}. ${item.name} (${item.machineId}) - due in ${item.dueInDays} day(s), ${item.priority}, downtime ${item.estimatedDowntime}.`
    ),
  ];
};

const wrapLine = (line, maxLength = 92) => {
  if (line.length <= maxLength) {
    return [line];
  }

  const words = line.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    if (`${current} ${word}`.trim().length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
};

const escapePdfText = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "");

const paginateLines = (lines) => {
  const wrapped = lines.flatMap((line) => (line ? wrapLine(line) : [""]));
  const pages = [];
  const pageSize = 49;

  for (let index = 0; index < wrapped.length; index += pageSize) {
    pages.push(wrapped.slice(index, index + pageSize));
  }

  return pages.length ? pages : [["No report data available."]];
};

const buildPdfContentStream = (lines) => {
  const content = [
    "BT",
    "/F1 10 Tf",
    "50 760 Td",
    "14 TL",
    ...lines.map((line) => `(${escapePdfText(line)}) Tj T*`),
    "ET",
  ].join("\n");

  return content;
};

export const generatePdfBuffer = (lines) => {
  const pages = paginateLines(lines);
  const objects = [];
  const addObject = (body) => {
    objects.push(body);
    return objects.length;
  };

  addObject(""); // Catalog placeholder.
  addObject(""); // Pages placeholder.
  const fontObjectId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageObjectIds = [];

  for (const pageLines of pages) {
    const stream = buildPdfContentStream(pageLines);
    const contentObjectId = addObject(
      `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
    );
    const pageObjectId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    pageObjectIds.push(pageObjectId);
  }

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
    .map((id) => `${id} 0 R`)
    .join(" ")}] /Count ${pageObjectIds.length} >>`;

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((body, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "utf8"));
    chunks.push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");

  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });

  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return Buffer.from(chunks.join(""), "utf8");
};

export const buildReport = ({ type, machines, notifications, workOrders }) => {
  const normalizedType = REPORT_TYPES[type] ? type : "maintenance";
  const lines = buildReportLines({
    type: normalizedType,
    machines,
    notifications,
    workOrders,
  });

  return {
    reportId: `KAVACH-${normalizedType.toUpperCase()}-${Date.now()}`,
    type: normalizedType,
    title: REPORT_TYPES[normalizedType],
    generatedAt: new Date().toISOString(),
    lines,
    pdf: generatePdfBuffer(lines),
  };
};

const escapeCsv = (value) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const reportToCsv = (report) =>
  ["Section,Value", ...report.lines.map((line, index) => `${index + 1},${escapeCsv(line)}`)].join("\n");

export const reportToExcelHtml = (report) => `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<table>
<thead><tr><th>Line</th><th>Value</th></tr></thead>
<tbody>
${report.lines
  .map(
    (line, index) =>
      `<tr><td>${index + 1}</td><td>${String(line)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</td></tr>`
  )
  .join("")}
</tbody>
</table>
</body>
</html>`;
