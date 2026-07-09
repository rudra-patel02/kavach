export const AI_ENGINE_VERSION = "13.0.0";

export const SENSOR_KEYS = [
  "temperature",
  "vibration",
  "pressure",
  "voltage",
  "current",
  "rpm",
  "energy",
  "oilLevel",
  "humidity",
];

export const FAILURE_TYPES = [
  "motorFailure",
  "bearingFailure",
  "pumpFailure",
  "hydraulicFailure",
  "electricalFailure",
  "coolingFailure",
];

export const SENSOR_CONFIG = {
  temperature: {
    label: "Temperature",
    unit: "C",
    defaultValue: 45,
    min: -40,
    max: 200,
    warningHigh: 82,
    criticalHigh: 95,
    spikeAbs: 8,
    spikePercent: 18,
    driftPercent: 12,
    dynamicPadding: 4,
  },
  vibration: {
    label: "Vibration",
    unit: "mm/s",
    defaultValue: 0.25,
    min: 0,
    max: 100,
    warningHigh: 0.85,
    criticalHigh: 1.4,
    spikeAbs: 0.28,
    spikePercent: 42,
    driftPercent: 24,
    dynamicPadding: 0.12,
  },
  pressure: {
    label: "Pressure",
    unit: "bar",
    defaultValue: 1.1,
    min: 0,
    max: 100,
    warningLow: 0.65,
    criticalLow: 0.45,
    warningHigh: 2.1,
    criticalHigh: 2.6,
    spikeAbs: 0.35,
    spikePercent: 22,
    driftPercent: 18,
    dynamicPadding: 0.16,
  },
  voltage: {
    label: "Voltage",
    unit: "V",
    defaultValue: 415,
    min: 0,
    max: 1000,
    warningLow: 380,
    criticalLow: 360,
    warningHigh: 445,
    criticalHigh: 470,
    spikeAbs: 22,
    spikePercent: 7,
    driftPercent: 5,
    dynamicPadding: 10,
  },
  current: {
    label: "Current",
    unit: "A",
    defaultValue: 35,
    min: 0,
    max: 5000,
    warningHigh: 520,
    criticalHigh: 900,
    spikeAbs: 65,
    spikePercent: 28,
    driftPercent: 20,
    dynamicPadding: 18,
  },
  rpm: {
    label: "RPM",
    unit: "rpm",
    defaultValue: 1450,
    min: 0,
    max: 50000,
    warningLow: 850,
    criticalLow: 550,
    warningHigh: 2200,
    criticalHigh: 3000,
    spikeAbs: 240,
    spikePercent: 18,
    driftPercent: 12,
    dynamicPadding: 80,
  },
  energy: {
    label: "Energy",
    unit: "kWh",
    defaultValue: 220,
    min: 0,
    max: 1000000000,
    warningHigh: 760,
    criticalHigh: 1100,
    spikeAbs: 95,
    spikePercent: 26,
    driftPercent: 18,
    dynamicPadding: 45,
  },
  oilLevel: {
    label: "Oil Level",
    unit: "%",
    defaultValue: 92,
    min: 0,
    max: 100,
    warningLow: 55,
    criticalLow: 32,
    spikeAbs: 12,
    spikePercent: 18,
    driftPercent: 14,
    dynamicPadding: 5,
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    defaultValue: 45,
    min: 0,
    max: 100,
    warningLow: 18,
    criticalLow: 10,
    warningHigh: 78,
    criticalHigh: 90,
    spikeAbs: 12,
    spikePercent: 22,
    driftPercent: 16,
    dynamicPadding: 6,
  },
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

export const coerceNumber = (value, fallback = undefined) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const average = (values) => {
  const numericValues = values
    .map((value) => Number(value))
    .filter(Number.isFinite);

  if (numericValues.length === 0) {
    return 0;
  }

  return (
    numericValues.reduce((total, value) => total + value, 0) /
    numericValues.length
  );
};

export const standardDeviation = (values) => {
  const numericValues = values
    .map((value) => Number(value))
    .filter(Number.isFinite);

  if (numericValues.length < 2) {
    return 0;
  }

  const mean = average(numericValues);
  const variance =
    numericValues.reduce((total, value) => total + (value - mean) ** 2, 0) /
    (numericValues.length - 1);

  return Math.sqrt(variance);
};

export const getSeverityFromScore = (score) => {
  if (score >= 82) return "Critical";
  if (score >= 60) return "High";
  if (score >= 35) return "Medium";
  return "Low";
};

export const getSeverityWeight = (severity) => {
  if (severity === "Critical") return 4;
  if (severity === "High") return 3;
  if (severity === "Medium") return 2;
  return 1;
};

export const buildTelemetryVector = (machine = {}, metrics = {}) => {
  const merged = {
    ...machine,
    ...metrics,
  };

  return SENSOR_KEYS.reduce((acc, sensor) => {
    const value =
      sensor === "energy"
        ? coerceNumber(
            metrics.energy ??
              metrics.energyConsumed ??
              machine.energyConsumed ??
              machine.power,
            undefined
          )
        : coerceNumber(merged[sensor], undefined);

    if (value !== undefined) {
      acc[sensor] = value;
    }

    return acc;
  }, {});
};

export const normalizeHistoryBySensor = (records = []) =>
  records.reduce((acc, record) => {
    const sensor = record.sensor;
    const value = coerceNumber(record.value, undefined);

    if (!SENSOR_CONFIG[sensor] || value === undefined) {
      return acc;
    }

    acc[sensor] = acc[sensor] || [];
    acc[sensor].push({
      value,
      timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
    });
    return acc;
  }, {});

export const getThresholdStatus = (sensor, value) => {
  const config = SENSOR_CONFIG[sensor];

  if (!config || !Number.isFinite(Number(value))) {
    return {
      score: 0,
      level: "normal",
      direction: "normal",
      message: "",
    };
  }

  const numericValue = Number(value);

  if (
    config.criticalHigh !== undefined &&
    numericValue >= config.criticalHigh
  ) {
    return {
      score: 92,
      level: "critical",
      direction: "high",
      message: `${config.label} is above the critical threshold`,
    };
  }

  if (config.warningHigh !== undefined && numericValue >= config.warningHigh) {
    return {
      score: 62,
      level: "warning",
      direction: "high",
      message: `${config.label} is above the warning threshold`,
    };
  }

  if (config.criticalLow !== undefined && numericValue <= config.criticalLow) {
    return {
      score: 90,
      level: "critical",
      direction: "low",
      message: `${config.label} is below the critical threshold`,
    };
  }

  if (config.warningLow !== undefined && numericValue <= config.warningLow) {
    return {
      score: 58,
      level: "warning",
      direction: "low",
      message: `${config.label} is below the warning threshold`,
    };
  }

  return {
    score: 0,
    level: "normal",
    direction: "normal",
    message: "",
  };
};

export const getBadDirection = (sensor, delta) => {
  const config = SENSOR_CONFIG[sensor];

  if (!config || !Number.isFinite(delta)) {
    return false;
  }

  if (config.warningHigh !== undefined && delta > 0) {
    return true;
  }

  if (config.warningLow !== undefined && delta < 0) {
    return true;
  }

  return false;
};
