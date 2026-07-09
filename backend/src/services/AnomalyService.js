import {
  SENSOR_CONFIG,
  SENSOR_KEYS,
  average,
  clamp,
  getBadDirection,
  getSeverityFromScore,
  getThresholdStatus,
  round,
  standardDeviation,
} from "./AIConfig.js";

const MIN_HISTORY_FOR_DYNAMIC_BASELINE = 4;

const getRecentValues = (series = [], limit = 40) =>
  series
    .slice(-limit)
    .map((point) => Number(point.value))
    .filter(Number.isFinite);

const buildDynamicThreshold = (sensor, values) => {
  const config = SENSOR_CONFIG[sensor];
  const baseline =
    values.length >= MIN_HISTORY_FOR_DYNAMIC_BASELINE
      ? average(values)
      : config.defaultValue;
  const deviation =
    values.length >= MIN_HISTORY_FOR_DYNAMIC_BASELINE
      ? standardDeviation(values)
      : 0;
  const spread = Math.max(
    deviation * 2.6,
    Math.abs(baseline) * 0.08,
    config.dynamicPadding
  );

  return {
    min: round(clamp(baseline - spread, config.min, config.max), 3),
    max: round(clamp(baseline + spread, config.min, config.max), 3),
    baseline: round(baseline, 3),
    standardDeviation: round(deviation, 3),
    samples: values.length,
  };
};

const scoreZ = (zScore) => {
  const absolute = Math.abs(zScore);

  if (absolute >= 4) return 82;
  if (absolute >= 3) return 62;
  if (absolute >= 2.35) return 38;
  return 0;
};

const analyzeSensor = ({ sensor, value, history = [] }) => {
  const config = SENSOR_CONFIG[sensor];
  const recentValues = getRecentValues(history);
  const threshold = buildDynamicThreshold(sensor, recentValues);
  const movingAverage = round(average(recentValues.slice(-8)), 3);
  const previous = recentValues.at(-1);
  const baseline = threshold.baseline;
  const deviation = threshold.standardDeviation;
  const zScore =
    deviation > 0 ? round((Number(value) - baseline) / deviation, 3) : 0;
  const thresholdStatus = getThresholdStatus(sensor, value);
  const signals = [];

  if (thresholdStatus.score > 0) {
    signals.push({
      type: "threshold",
      score: thresholdStatus.score,
      direction: thresholdStatus.direction,
      message: thresholdStatus.message,
    });
  }

  if (Number(value) < threshold.min || Number(value) > threshold.max) {
    signals.push({
      type: "dynamic_threshold",
      score: Number(value) > threshold.max ? 42 : 38,
      direction: Number(value) > threshold.max ? "high" : "low",
      message: `${config.label} moved outside its dynamic operating band`,
    });
  }

  const zScoreValue = scoreZ(zScore);

  if (zScoreValue > 0) {
    signals.push({
      type: "z_score",
      score: zScoreValue,
      direction: zScore > 0 ? "high" : "low",
      message: `${config.label} z-score reached ${round(zScore, 2)}`,
    });
  }

  if (previous !== undefined) {
    const delta = Number(value) - previous;
    const percentChange =
      Math.abs(previous) > 0.0001 ? (Math.abs(delta) / Math.abs(previous)) * 100 : 0;
    const isSpike =
      Math.abs(delta) >= config.spikeAbs ||
      percentChange >= config.spikePercent;

    if (isSpike && getBadDirection(sensor, delta)) {
      signals.push({
        type: "spike",
        score: percentChange >= config.spikePercent * 1.6 ? 58 : 42,
        direction: delta > 0 ? "high" : "low",
        message: `${config.label} changed suddenly from ${round(
          previous,
          2
        )} to ${round(value, 2)}`,
      });
    }
  }

  const driftValues = [...recentValues.slice(-18), Number(value)];

  if (driftValues.length >= 10) {
    const midpoint = Math.floor(driftValues.length / 2);
    const earlyAverage = average(driftValues.slice(0, midpoint));
    const lateAverage = average(driftValues.slice(midpoint));
    const delta = lateAverage - earlyAverage;
    const percentDrift =
      Math.abs(earlyAverage) > 0.0001
        ? (Math.abs(delta) / Math.abs(earlyAverage)) * 100
        : 0;

    if (percentDrift >= config.driftPercent && getBadDirection(sensor, delta)) {
      signals.push({
        type: "drift",
        score: percentDrift >= config.driftPercent * 1.8 ? 56 : 36,
        direction: delta > 0 ? "high" : "low",
        message: `${config.label} is drifting ${delta > 0 ? "up" : "down"} over the recent window`,
      });
    }
  }

  const score = round(
    clamp(
      signals.reduce((total, signal) => total + signal.score, 0) * 0.72,
      0,
      100
    ),
    1
  );

  return {
    sensor,
    label: config.label,
    value: round(value, sensor === "vibration" || sensor === "pressure" ? 3 : 1),
    unit: config.unit,
    movingAverage,
    baseline,
    zScore,
    dynamicThreshold: {
      min: threshold.min,
      max: threshold.max,
    },
    severityScore: score,
    status: score >= 35 ? getSeverityFromScore(score) : "Normal",
    signals,
  };
};

const buildReason = (sensorResults) => {
  const abnormalSensors = sensorResults
    .filter((sensor) => sensor.status !== "Normal")
    .sort((a, b) => b.severityScore - a.severityScore)
    .slice(0, 3);

  if (abnormalSensors.length === 0) {
    return "Telemetry remains within learned operating patterns.";
  }

  return abnormalSensors
    .map((sensor) => {
      const strongestSignal = sensor.signals[0]?.message || `${sensor.label} abnormal`;
      return `${strongestSignal} (${sensor.value}${sensor.unit})`;
    })
    .join("; ");
};

export const analyzeAnomalies = ({
  telemetry = {},
  historyBySensor = {},
  timestamp = new Date(),
} = {}) => {
  const sensorResults = SENSOR_KEYS.filter(
    (sensor) => telemetry[sensor] !== undefined && telemetry[sensor] !== null
  ).map((sensor) =>
    analyzeSensor({
      sensor,
      value: telemetry[sensor],
      history: historyBySensor[sensor] || [],
    })
  );
  const abnormalSensors = sensorResults.filter(
    (sensor) => sensor.status !== "Normal"
  );
  const maxScore = abnormalSensors.reduce(
    (max, sensor) => Math.max(max, sensor.severityScore),
    0
  );
  const aggregateScore = average(
    abnormalSensors.map((sensor) => sensor.severityScore)
  );
  const severityScore = round(clamp(maxScore * 0.68 + aggregateScore * 0.32, 0, 100), 1);
  const telemetryCompleteness = sensorResults.length / SENSOR_KEYS.length;
  const historyDepth = average(
    SENSOR_KEYS.map((sensor) => (historyBySensor[sensor] || []).length)
  );
  const signalCount = abnormalSensors.reduce(
    (count, sensor) => count + sensor.signals.length,
    0
  );
  const confidence = round(
    clamp(
      45 +
        telemetryCompleteness * 22 +
        clamp(historyDepth / 30, 0, 1) * 18 +
        clamp(signalCount / 6, 0, 1) * 15,
      abnormalSensors.length ? 58 : 46,
      99
    ),
    1
  );
  const severity = getSeverityFromScore(severityScore);

  return {
    anomaly: severityScore >= 35,
    severity: severityScore >= 35 ? severity : "Low",
    confidence,
    severityScore,
    reason: buildReason(sensorResults),
    timestamp: new Date(timestamp).toISOString(),
    sensors: sensorResults,
    dynamicThresholds: sensorResults.reduce((acc, sensor) => {
      acc[sensor.sensor] = sensor.dynamicThreshold;
      return acc;
    }, {}),
    movingAverages: sensorResults.reduce((acc, sensor) => {
      acc[sensor.sensor] = sensor.movingAverage;
      return acc;
    }, {}),
    zScores: sensorResults.reduce((acc, sensor) => {
      acc[sensor.sensor] = sensor.zScore;
      return acc;
    }, {}),
    spikeDetections: sensorResults
      .filter((sensor) => sensor.signals.some((signal) => signal.type === "spike"))
      .map((sensor) => sensor.sensor),
    driftDetections: sensorResults
      .filter((sensor) => sensor.signals.some((signal) => signal.type === "drift"))
      .map((sensor) => sensor.sensor),
  };
};
