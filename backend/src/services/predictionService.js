const riskOrder = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round = (value, digits = 1) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(digits));
};

const average = (values) => {
  const numericValues = values.filter((value) => Number.isFinite(value));

  if (numericValues.length === 0) {
    return 0;
  }

  return numericValues.reduce((total, value) => total + value, 0) / numericValues.length;
};

const getEnergy = (machine) =>
  Number.isFinite(Number(machine.energyConsumed))
    ? Number(machine.energyConsumed)
    : Number(machine.power || 0);

const normalizeAbove = (value, warning, critical) =>
  clamp(((Number(value) || 0) - warning) / (critical - warning), 0, 1);

const normalizeBand = (value, normalLow, normalHigh, criticalLow, criticalHigh) => {
  const numericValue = Number(value) || 0;

  if (numericValue < normalLow) {
    return clamp((normalLow - numericValue) / (normalLow - criticalLow), 0, 1);
  }

  if (numericValue > normalHigh) {
    return clamp((numericValue - normalHigh) / (criticalHigh - normalHigh), 0, 1);
  }

  return 0;
};

const getAiPredictionRisk = (machine) => {
  const failureRisk = String(machine.aiPrediction?.failureRisk || "").toLowerCase();
  const maintenanceInDays = Number(machine.aiPrediction?.maintenanceInDays);

  let risk = 0;

  if (failureRisk === "high") {
    risk += 0.3;
  } else if (failureRisk === "medium") {
    risk += 0.16;
  } else if (failureRisk === "low") {
    risk += 0.03;
  }

  if (Number.isFinite(maintenanceInDays)) {
    if (maintenanceInDays <= 1) {
      risk += 0.24;
    } else if (maintenanceInDays <= 7) {
      risk += 0.12;
    } else if (maintenanceInDays <= 14) {
      risk += 0.06;
    }
  }

  return clamp(risk, 0, 0.45);
};

const getFailureProbability = (machine) => {
  const healthRisk = clamp((100 - (Number(machine.health) || 0)) / 100, 0, 1);
  const temperatureRisk = normalizeAbove(machine.temperature, 70, 95);
  const vibrationRisk = normalizeAbove(machine.vibration, 0.55, 1.4);
  const pressureRisk = normalizeBand(machine.pressure, 0.9, 1.6, 0.5, 2.4);
  const energyRisk = normalizeAbove(getEnergy(machine), 520, 980);
  const statusRisk =
    machine.status === "Critical"
      ? 0.26
      : machine.status === "Warning"
        ? 0.14
        : machine.status === "Offline"
          ? 0.2
          : 0;

  const probability =
    healthRisk * 0.3 +
    temperatureRisk * 0.18 +
    vibrationRisk * 0.2 +
    pressureRisk * 0.1 +
    energyRisk * 0.1 +
    getAiPredictionRisk(machine) +
    statusRisk;

  return round(clamp(probability * 100, 2, 98), 1);
};

const getRiskLevel = (failureProbability) => {
  if (failureProbability >= 78) return "Critical";
  if (failureProbability >= 58) return "High";
  if (failureProbability >= 32) return "Medium";
  return "Low";
};

const getMaintenancePriority = (riskLevel) => {
  if (riskLevel === "Critical") return "Immediate";
  if (riskLevel === "High") return "High";
  if (riskLevel === "Medium") return "Planned";
  return "Monitor";
};

const getRemainingUsefulLifeHours = (machine, failureProbability, riskLevel) => {
  const maintenanceInDays = Number(machine.aiPrediction?.maintenanceInDays);
  const predictionHours = Number.isFinite(maintenanceInDays)
    ? maintenanceInDays * 24
    : null;

  const healthHours = clamp(((Number(machine.health) || 0) / 100) * 720, 12, 720);
  const probabilityHours = clamp((100 - failureProbability) * 7.2, 4, 720);
  const riskFactor =
    riskLevel === "Critical"
      ? 0.35
      : riskLevel === "High"
        ? 0.58
        : riskLevel === "Medium"
          ? 0.78
          : 1;

  const values = [healthHours, probabilityHours];

  if (predictionHours !== null) {
    values.push(predictionHours);
  }

  return Math.max(4, Math.round(average(values) * riskFactor));
};

const getAiConfidence = (machine, failureProbability, riskLevel) => {
  const fields = [
    machine.temperature,
    machine.vibration,
    machine.pressure,
    getEnergy(machine),
    machine.health,
  ];
  const telemetryCompleteness =
    fields.filter((value) => Number.isFinite(Number(value))).length / fields.length;
  const hasAiPrediction = machine.aiPrediction ? 1 : 0;
  const statusAligned =
    (riskLevel === "Critical" && machine.status === "Critical") ||
    (riskLevel === "High" && ["Warning", "Critical", "Offline"].includes(machine.status)) ||
    (riskLevel === "Medium" && ["Running", "Warning"].includes(machine.status)) ||
    (riskLevel === "Low" && machine.status === "Running")
      ? 1
      : 0.65;
  const riskClarity = Math.abs(failureProbability - 50) / 50;

  return round(
    clamp(
      telemetryCompleteness * 62 + hasAiPrediction * 18 + statusAligned * 12 + riskClarity * 8,
      52,
      99
    ),
    1
  );
};

const getProbableCause = (machine) => {
  const highTemperature = Number(machine.temperature) >= 80;
  const highVibration = Number(machine.vibration) >= 0.7;
  const pressure = Number(machine.pressure) || 0;
  const highEnergy = getEnergy(machine) >= 650;

  if (highTemperature && highVibration) {
    return "Thermal and vibration stress indicate probable bearing wear, lubrication failure, or shaft misalignment.";
  }

  if (highTemperature && highEnergy) {
    return "Thermal load and energy draw suggest overload, cooling restriction, or mechanical drag.";
  }

  if (highVibration) {
    return "Vibration trend suggests imbalance, bearing wear, loose mounting, or alignment drift.";
  }

  if (pressure > 1.8 || pressure < 0.8) {
    return "Pressure deviation suggests a valve, filter, pump, or sensor calibration issue.";
  }

  if (highEnergy) {
    return "Energy intensity is elevated, usually caused by load mismatch, friction, or efficiency loss.";
  }

  return "No severe fault signature is visible; keep the asset in preventive monitoring.";
};

const getRecommendation = (machine, riskLevel) => {
  if (riskLevel === "Critical") {
    return "Create an immediate controlled maintenance window, reduce load if safe, and inspect bearings, lubrication, pressure controls, and electrical load.";
  }

  if (riskLevel === "High") {
    return "Schedule inspection within 48 hours, verify cooling and lubrication, and keep spare parts ready.";
  }

  if (riskLevel === "Medium") {
    return "Plan preventive maintenance in the next weekly window and trend-check temperature, vibration, and pressure.";
  }

  return "Continue normal operation with routine monitoring.";
};

const getCalendarOffsetDays = (riskLevel) => {
  if (riskLevel === "Critical") return 0;
  if (riskLevel === "High") return 2;
  if (riskLevel === "Medium") return 7;
  return 21;
};

const getEstimatedDowntimeHours = (riskLevel) => {
  if (riskLevel === "Critical") return 8;
  if (riskLevel === "High") return 4;
  if (riskLevel === "Medium") return 2;
  return 1;
};

const createCalendarDate = (riskLevel) => {
  const date = new Date();
  date.setDate(date.getDate() + getCalendarOffsetDays(riskLevel));
  return date.toISOString().slice(0, 10);
};

const getTrendDirection = (riskLevel) => {
  if (riskLevel === "Critical") return "Escalating";
  if (riskLevel === "High") return "Rising";
  if (riskLevel === "Medium") return "Watch";
  return "Stable";
};

const buildMachineTrend = (prediction, key, baseline) => {
  const riskMultiplier = riskOrder[prediction.riskLevel] || 1;
  const labels = ["T-5h", "T-4h", "T-3h", "T-2h", "T-1h", "Now"];
  const direction = key === "health" ? -1 : 1;

  return labels.map((time, index) => {
    const distance = labels.length - 1 - index;
    const adjustment = direction * distance * riskMultiplier * 0.7;

    return {
      time,
      value: round(clamp(baseline - adjustment, 0, key === "health" || key === "failureProbability" ? 100 : 1200), 1),
    };
  });
};

const buildPredictionTimeline = (prediction, trends) =>
  trends.failureProbability.map((point, index) => ({
    time: point.time,
    failureProbability: point.value,
    riskScore: point.value,
    health: trends.health[index]?.value || prediction.machineHealth,
    confidence: prediction.aiConfidence,
  }));

const normalizePredictionHistory = (machine, prediction, trends) => {
  const existingHistory = Array.isArray(machine.predictionHistory)
    ? machine.predictionHistory
    : [];

  if (existingHistory.length > 0) {
    return existingHistory.slice(-20).map((item) => ({
      timestamp: item.timestamp
        ? new Date(item.timestamp).toISOString()
        : new Date().toISOString(),
      failureProbability: round(item.failureProbability, 1),
      remainingUsefulLifeHours: Math.round(
        Number(item.remainingUsefulLifeHours || prediction.remainingUsefulLifeHours)
      ),
      maintenancePriority:
        item.maintenancePriority || prediction.maintenancePriority,
      riskLevel: item.riskLevel || prediction.riskLevel,
      confidenceScore: round(item.confidenceScore || prediction.aiConfidence, 1),
    }));
  }

  return trends.failureProbability.map((point, index) => {
    const timestamp = new Date();
    timestamp.setHours(timestamp.getHours() - (trends.failureProbability.length - index - 1));

    return {
      timestamp: timestamp.toISOString(),
      failureProbability: point.value,
      remainingUsefulLifeHours: Math.max(
        4,
        prediction.remainingUsefulLifeHours +
          (trends.failureProbability.length - index - 1) * 4
      ),
      maintenancePriority: prediction.maintenancePriority,
      riskLevel: prediction.riskLevel,
      confidenceScore: prediction.aiConfidence,
    };
  });
};

export const createMachinePrediction = (machine) => {
  const machineHealth = round(machine.health, 1);
  const failureProbability = getFailureProbability(machine);
  const riskLevel = getRiskLevel(failureProbability);
  const remainingUsefulLifeHours = getRemainingUsefulLifeHours(
    machine,
    failureProbability,
    riskLevel
  );
  const aiConfidence = getAiConfidence(machine, failureProbability, riskLevel);
  const maintenancePriority = getMaintenancePriority(riskLevel);
  const energy = round(getEnergy(machine), 1);

  const prediction = {
    machineId: machine.machineId,
    name: machine.name,
    department: machine.department || "Production",
    status: machine.status || "Unknown",
    machineHealth,
    healthScore: machineHealth,
    failureProbability,
    failureProbabilityPercent: failureProbability,
    remainingUsefulLifeHours,
    aiConfidence,
    confidencePercent: aiConfidence,
    riskLevel,
    maintenancePriority,
    trendDirection: getTrendDirection(riskLevel),
    probableCause: getProbableCause(machine),
    recommendation: getRecommendation(machine, riskLevel),
    recommendedAction: getRecommendation(machine, riskLevel),
    estimatedDowntimeHours: getEstimatedDowntimeHours(riskLevel),
    inspectionDate: createCalendarDate(riskLevel),
    telemetry: {
      temperature: round(machine.temperature, 1),
      vibration: round(machine.vibration, 2),
      pressure: round(machine.pressure, 2),
      humidity: round(machine.humidity, 1),
      power: round(machine.power, 1),
      current: round(machine.current, 1),
      voltage: round(machine.voltage, 1),
      efficiency: round(machine.efficiency, 1),
      oee: round(machine.oee, 1),
      energy,
      health: machineHealth,
    },
    aiPrediction: machine.aiPrediction || null,
  };
  const trends = {
    temperature: buildMachineTrend(prediction, "temperature", prediction.telemetry.temperature),
    health: buildMachineTrend(prediction, "health", prediction.machineHealth),
    failureProbability: buildMachineTrend(
      prediction,
      "failureProbability",
      prediction.failureProbability
    ),
    energy: buildMachineTrend(prediction, "energy", prediction.telemetry.energy),
  };
  const predictionTimeline = buildPredictionTimeline(prediction, trends);

  return {
    ...prediction,
    riskScore: prediction.failureProbability,
    rootCause: prediction.probableCause,
    confidenceScore: prediction.aiConfidence,
    maintenanceUrgency: prediction.maintenancePriority,
    recommendationEngine: {
      recommendedAction: prediction.recommendation,
      probableCause: prediction.probableCause,
      priority: prediction.maintenancePriority,
      riskLevel: prediction.riskLevel,
    },
    predictionTimeline,
    healthTrend: trends.health,
    riskTrend: prediction.trendDirection,
    predictionHistory: normalizePredictionHistory(machine, prediction, trends),
    historicalTrend: {
      health: trends.health,
      temperature: trends.temperature,
      failureProbability: trends.failureProbability,
      energy: trends.energy,
    },
    trends,
  };
};

const sortPredictionsByRisk = (predictions) =>
  [...predictions].sort((a, b) => {
    const riskDelta = riskOrder[b.riskLevel] - riskOrder[a.riskLevel];

    if (riskDelta !== 0) {
      return riskDelta;
    }

    return (
      b.failureProbability - a.failureProbability ||
      a.remainingUsefulLifeHours - b.remainingUsefulLifeHours
    );
  });

const buildPlantTrend = (predictions, key) => {
  const labels = ["T-5h", "T-4h", "T-3h", "T-2h", "T-1h", "Now"];

  return labels.map((time, index) => ({
    time,
    value: round(average(predictions.map((machine) => machine.trends[key][index].value)), 1),
  }));
};

const getPlantRiskLevel = (averageFailureProbability) =>
  getRiskLevel(averageFailureProbability);

const getRiskDistribution = (predictions) =>
  predictions.reduce(
    (distribution, prediction) => {
      distribution[prediction.riskLevel] += 1;
      return distribution;
    },
    {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    }
  );

export const buildPredictiveOverview = (machines) => {
  const predictions = sortPredictionsByRisk(
    machines.map((machine) => createMachinePrediction(machine))
  );
  const averageMachineHealth = round(
    average(predictions.map((prediction) => prediction.machineHealth)),
    1
  );
  const averageFailureProbability = round(
    average(predictions.map((prediction) => prediction.failureProbability)),
    1
  );
  const averageRemainingUsefulLifeHours = Math.round(
    average(predictions.map((prediction) => prediction.remainingUsefulLifeHours))
  );
  const averageAiConfidence = round(
    average(predictions.map((prediction) => prediction.aiConfidence)),
    1
  );
  const plantRiskLevel = getPlantRiskLevel(averageFailureProbability);
  const riskDistribution = getRiskDistribution(predictions);
  const highRiskMachines = predictions.filter((prediction) =>
    ["High", "Critical"].includes(prediction.riskLevel)
  );

  return {
    generatedAt: new Date().toISOString(),
    source: "rule_based_current_telemetry",
    summary: {
      totalMachines: predictions.length,
      machineHealth: averageMachineHealth,
      failureProbability: averageFailureProbability,
      riskScore: averageFailureProbability,
      remainingUsefulLifeHours: averageRemainingUsefulLifeHours,
      aiConfidence: averageAiConfidence,
      riskLevel: plantRiskLevel,
      maintenancePriority: getMaintenancePriority(plantRiskLevel),
      maintenanceUrgency: getMaintenancePriority(plantRiskLevel),
      highRiskMachines: highRiskMachines.length,
      riskDistribution,
    },
    kpis: [
      {
        label: "Machine Health",
        value: averageMachineHealth,
        unit: "%",
        riskLevel: getRiskLevel(100 - averageMachineHealth),
      },
      {
        label: "Failure Probability",
        value: averageFailureProbability,
        unit: "%",
        riskLevel: plantRiskLevel,
      },
      {
        label: "Risk Score",
        value: averageFailureProbability,
        unit: "%",
        riskLevel: plantRiskLevel,
      },
      {
        label: "Remaining Useful Life",
        value: averageRemainingUsefulLifeHours,
        unit: "hrs",
        riskLevel:
          averageRemainingUsefulLifeHours <= 48
            ? "Critical"
            : averageRemainingUsefulLifeHours <= 120
              ? "High"
              : averageRemainingUsefulLifeHours <= 240
                ? "Medium"
                : "Low",
      },
      {
        label: "AI Confidence",
        value: averageAiConfidence,
        unit: "%",
        riskLevel: "Low",
      },
    ],
    trends: {
      temperature: buildPlantTrend(predictions, "temperature"),
      health: buildPlantTrend(predictions, "health"),
      failureProbability: buildPlantTrend(predictions, "failureProbability"),
      energy: buildPlantTrend(predictions, "energy"),
    },
    predictionTimeline: buildPlantTrend(predictions, "failureProbability").map(
      (point, index) => ({
        time: point.time,
        failureProbability: point.value,
        riskScore: point.value,
        health: buildPlantTrend(predictions, "health")[index]?.value || 0,
        confidence: averageAiConfidence,
      })
    ),
    predictions,
    ranking: predictions.map((prediction, index) => ({
      rank: index + 1,
      machineId: prediction.machineId,
      name: prediction.name,
      department: prediction.department,
      machineHealth: prediction.machineHealth,
      failureProbability: prediction.failureProbability,
      remainingUsefulLifeHours: prediction.remainingUsefulLifeHours,
      aiConfidence: prediction.aiConfidence,
      riskLevel: prediction.riskLevel,
      maintenancePriority: prediction.maintenancePriority,
    })),
    maintenanceCalendar: predictions
      .filter((prediction) => prediction.riskLevel !== "Low")
      .map((prediction) => ({
        date: prediction.inspectionDate,
        machineId: prediction.machineId,
        name: prediction.name,
        task:
          prediction.riskLevel === "Critical"
            ? "Emergency inspection"
            : prediction.riskLevel === "High"
              ? "Priority maintenance"
              : "Preventive inspection",
        priority: prediction.maintenancePriority,
        riskLevel: prediction.riskLevel,
        estimatedDowntimeHours: prediction.estimatedDowntimeHours,
      })),
    recommendations: predictions.slice(0, 5).map((prediction) => ({
      machineId: prediction.machineId,
      name: prediction.name,
      title: `${prediction.name} maintenance recommendation`,
      riskLevel: prediction.riskLevel,
      priority: prediction.maintenancePriority,
      probableCause: prediction.probableCause,
      recommendation: prediction.recommendation,
      confidence: prediction.aiConfidence,
    })),
  };
};

export const buildPredictiveMachineDetail = (machine) => {
  const prediction = createMachinePrediction(machine);

  return {
    generatedAt: new Date().toISOString(),
    source: "rule_based_current_telemetry",
    machine: {
      machineId: machine.machineId,
      name: machine.name,
      department: machine.department || "Production",
      status: machine.status || "Unknown",
      lastHeartbeat: machine.lastHeartbeat || null,
    },
    prediction,
    predictionHistory: prediction.predictionHistory,
    historicalTrend: prediction.historicalTrend,
  };
};
