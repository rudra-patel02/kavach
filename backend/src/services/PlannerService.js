import { clamp, round } from "./AIConfig.js";

const priorityRank = {
  Immediate: 4,
  High: 3,
  Planned: 2,
  Monitor: 1,
};

const priorityFromRisk = (risk) => {
  if (risk >= 82) return "Immediate";
  if (risk >= 62) return "High";
  if (risk >= 34) return "Planned";
  return "Monitor";
};

const getScheduleOffsetHours = (priority) => {
  if (priority === "Immediate") return 4;
  if (priority === "High") return 24;
  if (priority === "Planned") return 96;
  return 336;
};

const addHours = (date, hours) => {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
};

const sparePartsForCause = (cause = "") => {
  const value = String(cause).toLowerCase();

  if (value.includes("bearing")) return ["Bearing kit", "Grease cartridge", "Seal set"];
  if (value.includes("alignment")) return ["Coupling insert", "Shim set", "Alignment targets"];
  if (value.includes("lubrication")) return ["Industrial lubricant", "Oil filter", "Seal kit"];
  if (value.includes("overload")) return ["Motor protection relay", "Drive belt", "Thermal sensor"];
  if (value.includes("foundation")) return ["Anchor bolts", "Grout pack", "Vibration pads"];
  if (value.includes("cooling")) return ["Air filter", "Cooling fan", "Coolant hose"];
  if (value.includes("hydraulic")) return ["Hydraulic filter", "Valve seal kit", "Pressure sensor"];
  if (value.includes("electrical")) return ["Terminal lugs", "Contactor", "VFD inspection kit"];
  if (value.includes("pump")) return ["Pump seal", "Impeller kit", "Suction strainer"];

  return ["Inspection kit", "Lubricant", "Sensor calibration kit"];
};

export const generateMaintenancePlan = ({
  machine = {},
  anomaly,
  rootCause,
  rul,
  forecast,
} = {}) => {
  const topCause = rootCause?.causes?.[0];
  const risk = Math.max(
    Number(rul?.riskPercent || rul?.risk || 0),
    Number(forecast?.peakProbability || 0),
    Number(anomaly?.severityScore || 0)
  );
  const priority = priorityFromRisk(risk);
  const topCauseName = topCause?.cause || "Preventive maintenance";
  const estimatedDowntimeHours = round(
    clamp(
      priorityRank[priority] * 1.6 +
        (topCause?.probability || 0) * 0.035 +
        (priority === "Immediate" ? 3 : 0),
      1,
      18
    ),
    1
  );
  const estimatedCost = Math.round(
    2200 +
      priorityRank[priority] * 1800 +
      estimatedDowntimeHours * 650 +
      (topCause?.probability || 0) * 55
  );
  const technicians =
    priority === "Immediate"
      ? ["Maintenance Lead", "Mechanical Technician", "Electrical Technician"]
      : priority === "High"
        ? ["Maintenance Engineer", "Mechanical Technician"]
        : ["Maintenance Technician"];
  const scheduleStart = addHours(new Date(), getScheduleOffsetHours(priority));
  const estimatedCompletion = addHours(scheduleStart, estimatedDowntimeHours);
  const actions =
    topCause?.correctiveActions?.length > 0
      ? topCause.correctiveActions
      : ["Inspect asset condition.", "Validate sensor readings.", "Schedule preventive maintenance."];

  return {
    priority,
    estimatedDowntimeHours,
    estimatedCost,
    requiredTechnicians: technicians,
    requiredSpareParts: sparePartsForCause(topCauseName),
    estimatedCompletionTime: estimatedCompletion.toISOString(),
    calendarRecommendations: [
      {
        date: scheduleStart.toISOString(),
        title:
          priority === "Immediate"
            ? `Controlled shutdown for ${machine.name || machine.machineId}`
            : `Maintenance window for ${machine.name || machine.machineId}`,
        priority,
        durationHours: estimatedDowntimeHours,
      },
      {
        date: addHours(scheduleStart, -2).toISOString(),
        title: "Prepare spare parts and technician briefing",
        priority,
        durationHours: 1,
      },
    ],
    actions,
    summary: `${priority} maintenance plan for ${topCauseName}.`,
  };
};
