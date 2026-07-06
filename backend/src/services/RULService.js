import {
  average,
  clamp,
  round,
} from "./AIConfig.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const getMachineAgeDays = (machine) => {
  const createdAt = machine.createdAt ? new Date(machine.createdAt) : null;

  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return 0;
  }

  return Math.max(0, (Date.now() - createdAt.getTime()) / MS_PER_DAY);
};

const getRecentMaintenanceRelief = (maintenanceHistory = []) => {
  const completed = maintenanceHistory
    .map((item) => (item.completedAt ? new Date(item.completedAt) : null))
    .filter((date) => date && !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  if (completed.length === 0) {
    return 0;
  }

  const daysSince = (Date.now() - completed[0].getTime()) / MS_PER_DAY;

  if (daysSince <= 7) return 12;
  if (daysSince <= 30) return 7;
  if (daysSince <= 90) return 3;
  return 0;
};

const getLoadFactor = ({ load, telemetry = {} }) => {
  const explicitLoad = Number(load);

  if (Number.isFinite(explicitLoad)) {
    return clamp(explicitLoad / 100, 0.35, 1.45);
  }

  const current = Number(telemetry.current);
  const energy = Number(telemetry.energy);
  const rpm = Number(telemetry.rpm);
  const signals = [];

  if (Number.isFinite(current)) signals.push(clamp(current / 520, 0.2, 1.5));
  if (Number.isFinite(energy)) signals.push(clamp(energy / 760, 0.2, 1.5));
  if (Number.isFinite(rpm)) signals.push(clamp(rpm / 1450, 0.35, 1.35));

  return signals.length ? average(signals) : 0.85;
};

export const estimateRUL = ({
  machine = {},
  telemetry = {},
  anomaly,
  rootCause,
  operatingHours,
  load,
} = {}) => {
  const baseHealth = Number.isFinite(Number(machine.health))
    ? Number(machine.health)
    : 100;
  const anomalyPenalty = anomaly?.anomaly
    ? anomaly.severity === "Critical"
      ? 28
      : anomaly.severity === "High"
        ? 18
        : anomaly.severity === "Medium"
          ? 10
          : 4
    : 0;
  const rootCausePenalty = clamp((rootCause?.causes?.[0]?.probability || 0) * 0.16, 0, 16);
  const ageDays = getMachineAgeDays(machine);
  const agePenalty = clamp(ageDays / 45, 0, 12);
  const loadFactor = getLoadFactor({ load, telemetry });
  const loadPenalty = clamp((loadFactor - 0.85) * 22, 0, 18);
  const maintenanceRelief = getRecentMaintenanceRelief(machine.maintenanceHistory);
  const health = round(
    clamp(
      baseHealth - anomalyPenalty - rootCausePenalty - agePenalty - loadPenalty + maintenanceRelief,
      0,
      100
    ),
    1
  );
  const explicitOperatingHours = Number(operatingHours);
  const derivedOperatingHours = Number.isFinite(explicitOperatingHours)
    ? explicitOperatingHours
    : Math.max(0, ageDays * 16 - Number(machine.downtime || 0));
  const risk = round(
    clamp(
      100 - health + anomalyPenalty * 0.7 + rootCausePenalty * 0.8 + loadPenalty * 0.7,
      1,
      99
    ),
    1
  );
  const baseLifeHours = clamp(1800 - derivedOperatingHours * 0.018, 240, 1800);
  const healthFactor = Math.max(0.04, (health / 100) ** 1.35);
  const riskFactor = clamp(1 - risk / 155, 0.08, 1);
  const remainingHours = Math.round(clamp(baseLifeHours * healthFactor * riskFactor, 4, 2400));
  const confidence = round(
    clamp(
      52 +
        (Number.isFinite(Number(machine.health)) ? 14 : 0) +
        (Object.keys(telemetry).length / 9) * 14 +
        (anomaly?.confidence || 50) * 0.16 +
        (rootCause?.confidence || 50) * 0.12,
      48,
      98
    ),
    1
  );

  return {
    remainingDays: round(remainingHours / 24, 1),
    remainingHours,
    risk,
    riskPercent: risk,
    health,
    healthPercent: health,
    confidence,
    confidencePercent: confidence,
    operatingHours: round(derivedOperatingHours, 1),
    loadPercent: round(loadFactor * 100, 1),
  };
};
