import {
  FAILURE_TYPES,
  SENSOR_CONFIG,
  clamp,
  round,
} from "./AIConfig.js";

const get = (telemetry, key, fallback = 0) => {
  const value = Number(telemetry[key]);
  return Number.isFinite(value) ? value : fallback;
};

const add = (scores, key, amount) => {
  scores[key] = (scores[key] || 0) + amount;
};

const getRootCauseBoost = (rootCause, contains, amount) =>
  (rootCause?.causes || []).some((cause) =>
    String(cause.cause || "").toLowerCase().includes(contains)
  )
    ? amount
    : 0;

export const forecastFailures = ({
  telemetry = {},
  anomaly,
  rootCause,
  rul,
} = {}) => {
  const temperature = get(telemetry, "temperature");
  const vibration = get(telemetry, "vibration");
  const current = get(telemetry, "current");
  const voltage = get(telemetry, "voltage", 415);
  const pressure = get(telemetry, "pressure", 1.1);
  const oilLevel = get(telemetry, "oilLevel", 100);
  const humidity = get(telemetry, "humidity", 45);
  const energy = get(telemetry, "energy");
  const baseRisk = Number(rul?.riskPercent || rul?.risk || 12);
  const anomalyBoost = anomaly?.anomaly
    ? anomaly.severity === "Critical"
      ? 24
      : anomaly.severity === "High"
        ? 16
        : 8
    : 0;
  const scores = FAILURE_TYPES.reduce((acc, type) => ({ ...acc, [type]: baseRisk * 0.42 }), {});

  if (temperature >= SENSOR_CONFIG.temperature.warningHigh) {
    add(scores, "motorFailure", 13);
    add(scores, "coolingFailure", 24);
    add(scores, "bearingFailure", 10);
  }

  if (vibration >= SENSOR_CONFIG.vibration.warningHigh) {
    add(scores, "bearingFailure", 28);
    add(scores, "pumpFailure", 12);
    add(scores, "motorFailure", 8);
  }

  if (current >= SENSOR_CONFIG.current.warningHigh || energy >= SENSOR_CONFIG.energy.warningHigh) {
    add(scores, "motorFailure", 24);
    add(scores, "electricalFailure", 12);
  }

  if (voltage <= SENSOR_CONFIG.voltage.warningLow || voltage >= SENSOR_CONFIG.voltage.warningHigh) {
    add(scores, "electricalFailure", 26);
    add(scores, "motorFailure", 10);
  }

  if (
    pressure <= SENSOR_CONFIG.pressure.warningLow ||
    pressure >= SENSOR_CONFIG.pressure.warningHigh
  ) {
    add(scores, "hydraulicFailure", 26);
    add(scores, "pumpFailure", 24);
  }

  if (oilLevel <= SENSOR_CONFIG.oilLevel.warningLow) {
    add(scores, "bearingFailure", 18);
    add(scores, "hydraulicFailure", 16);
    add(scores, "pumpFailure", 10);
  }

  if (humidity >= SENSOR_CONFIG.humidity.warningHigh) {
    add(scores, "coolingFailure", 8);
    add(scores, "electricalFailure", 7);
  }

  add(scores, "bearingFailure", getRootCauseBoost(rootCause, "bearing", 14));
  add(scores, "motorFailure", getRootCauseBoost(rootCause, "overload", 14));
  add(scores, "hydraulicFailure", getRootCauseBoost(rootCause, "hydraulic", 16));
  add(scores, "pumpFailure", getRootCauseBoost(rootCause, "pump", 16));
  add(scores, "electricalFailure", getRootCauseBoost(rootCause, "electrical", 16));
  add(scores, "coolingFailure", getRootCauseBoost(rootCause, "cooling", 16));

  const horizonDefinitions = [
    { horizon: "24 Hours", key: "24h", multiplier: 0.68 },
    { horizon: "7 Days", key: "7d", multiplier: 0.94 },
    { horizon: "30 Days", key: "30d", multiplier: 1.22 },
  ];
  const horizons = horizonDefinitions.map((definition) => {
    const probabilities = FAILURE_TYPES.reduce((acc, type) => {
      acc[type] = round(
        clamp((scores[type] + anomalyBoost) * definition.multiplier, 1, 98),
        1
      );
      return acc;
    }, {});

    return {
      ...definition,
      probabilities,
    };
  });
  const chart = horizons.map((item) => ({
    horizon: item.horizon,
    motorFailure: item.probabilities.motorFailure,
    bearingFailure: item.probabilities.bearingFailure,
    pumpFailure: item.probabilities.pumpFailure,
    hydraulicFailure: item.probabilities.hydraulicFailure,
    electricalFailure: item.probabilities.electricalFailure,
    coolingFailure: item.probabilities.coolingFailure,
  }));
  const peakProbability = Math.max(
    ...horizons.flatMap((horizon) => Object.values(horizon.probabilities))
  );

  return {
    generatedAt: new Date().toISOString(),
    confidence: round(clamp((rul?.confidence || 55) * 0.65 + (anomaly?.confidence || 55) * 0.25 + 8, 45, 97), 1),
    peakProbability: round(peakProbability, 1),
    horizons,
    probabilityChart: chart,
  };
};
