const HEALTHY_STATUSES = new Set(["Healthy", "Running", "Online"]);

const thresholds = {
  temperatureWarning: 75,
  temperatureCritical: 90,
  vibrationWarning: 0.7,
  vibrationCritical: 1.2,
  pressureLow: 0.8,
  pressureWarning: 1.6,
  pressureCritical: 2.2,
  powerWarning: 70,
  powerCritical: 85,
  energyWarning: 600,
  energyCritical: 850,
};

const riskWeight = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
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
    : Number(machine.energy || machine.power || 0);

const isHealthyStatus = (status) => HEALTHY_STATUSES.has(String(status || ""));

const hasStatus = (machine, status) =>
  String(machine.status || "").toLowerCase() === status.toLowerCase();

const getMachineLabel = (machine) =>
  machine?.name || machine?.machineId || "Unknown machine";

const includesAny = (message, terms) =>
  terms.some((term) => message.includes(term));

const getDominantIssue = (issues) => {
  const sorted = [...issues].sort(
    (a, b) => riskWeight[b.severity] - riskWeight[a.severity]
  );

  return sorted[0];
};

const inferRiskLevel = (machine, issues) => {
  if (
    hasStatus(machine, "Critical") ||
    round(machine.health, 0) < 40 ||
    issues.some((issue) => issue.severity === "Critical") ||
    String(machine.aiPrediction?.failureRisk || "").toLowerCase() === "high"
  ) {
    return "Critical";
  }

  if (
    round(machine.health, 0) < 60 ||
    hasStatus(machine, "Offline") ||
    issues.some((issue) => issue.severity === "High")
  ) {
    return "High";
  }

  if (
    round(machine.health, 0) < 80 ||
    hasStatus(machine, "Warning") ||
    issues.some((issue) => issue.severity === "Medium") ||
    String(machine.aiPrediction?.failureRisk || "").toLowerCase() === "medium"
  ) {
    return "Medium";
  }

  return "Low";
};

const getPriority = (riskLevel) => {
  if (riskLevel === "Critical") return "Immediate";
  if (riskLevel === "High") return "High";
  if (riskLevel === "Medium") return "Planned";
  return "Monitor";
};

const getEstimatedDowntime = (riskLevel) => {
  if (riskLevel === "Critical") return "4-8 hours";
  if (riskLevel === "High") return "2-4 hours";
  if (riskLevel === "Medium") return "1-2 hours";
  return "Under 1 hour";
};

const analyzeIssues = (machine) => {
  const issues = [];
  const temperature = round(machine.temperature);
  const vibration = round(machine.vibration, 2);
  const pressure = round(machine.pressure, 2);
  const power = round(machine.power);
  const energy = round(getEnergy(machine));
  const health = round(machine.health, 0);

  if (hasStatus(machine, "Critical")) {
    issues.push({
      key: "status",
      severity: "Critical",
      message: "Machine status is Critical.",
    });
  } else if (hasStatus(machine, "Offline")) {
    issues.push({
      key: "status",
      severity: "High",
      message: "Machine is Offline and needs availability checks.",
    });
  } else if (hasStatus(machine, "Warning")) {
    issues.push({
      key: "status",
      severity: "Medium",
      message: "Machine status is Warning.",
    });
  }

  if (health < 40) {
    issues.push({
      key: "health",
      severity: "Critical",
      message: `Health is critically low at ${health}%.`,
    });
  } else if (health < 60) {
    issues.push({
      key: "health",
      severity: "High",
      message: `Health is below the safe operating band at ${health}%.`,
    });
  } else if (health < 80) {
    issues.push({
      key: "health",
      severity: "Medium",
      message: `Health is trending down at ${health}%.`,
    });
  }

  if (temperature >= thresholds.temperatureCritical) {
    issues.push({
      key: "temperature",
      severity: "Critical",
      message: `Temperature is above the safe threshold at ${temperature} C.`,
    });
  } else if (temperature >= thresholds.temperatureWarning) {
    issues.push({
      key: "temperature",
      severity: "Medium",
      message: `Temperature is elevated at ${temperature} C.`,
    });
  }

  if (vibration >= thresholds.vibrationCritical) {
    issues.push({
      key: "vibration",
      severity: "Critical",
      message: `Vibration is severe at ${vibration}.`,
    });
  } else if (vibration >= thresholds.vibrationWarning) {
    issues.push({
      key: "vibration",
      severity: "Medium",
      message: `Vibration is above normal at ${vibration}.`,
    });
  }

  if (pressure >= thresholds.pressureCritical) {
    issues.push({
      key: "pressure",
      severity: "Critical",
      message: `Pressure is high at ${pressure} bar.`,
    });
  } else if (pressure >= thresholds.pressureWarning) {
    issues.push({
      key: "pressure",
      severity: "Medium",
      message: `Pressure is elevated at ${pressure} bar.`,
    });
  } else if (pressure > 0 && pressure <= thresholds.pressureLow) {
    issues.push({
      key: "pressure",
      severity: "Medium",
      message: `Pressure is below normal at ${pressure} bar.`,
    });
  }

  if (power >= thresholds.powerCritical) {
    issues.push({
      key: "power",
      severity: "High",
      message: `Power draw is unusually high at ${power} kW.`,
    });
  } else if (power >= thresholds.powerWarning) {
    issues.push({
      key: "power",
      severity: "Medium",
      message: `Power draw is elevated at ${power} kW.`,
    });
  }

  if (energy >= thresholds.energyCritical) {
    issues.push({
      key: "energy",
      severity: "High",
      message: `Energy consumption is very high at ${energy} kWh.`,
    });
  } else if (energy >= thresholds.energyWarning) {
    issues.push({
      key: "energy",
      severity: "Medium",
      message: `Energy consumption is elevated at ${energy} kWh.`,
    });
  }

  if (machine.aiPrediction?.failureRisk) {
    const failureRisk = String(machine.aiPrediction.failureRisk);

    if (failureRisk.toLowerCase() === "high") {
      issues.push({
        key: "aiPrediction",
        severity: "High",
        message: "AI prediction indicates high failure risk.",
      });
    } else if (failureRisk.toLowerCase() === "medium") {
      issues.push({
        key: "aiPrediction",
        severity: "Medium",
        message: "AI prediction indicates medium failure risk.",
      });
    }
  }

  return issues;
};

const inferPossibleCause = (machine, issues) => {
  const keys = new Set(issues.map((issue) => issue.key));

  if (keys.has("temperature") && keys.has("vibration")) {
    return "Bearing wear, lubrication breakdown, misalignment, or sustained overload is likely because heat and vibration are rising together.";
  }

  if (keys.has("temperature") && keys.has("pressure")) {
    return "Cooling restriction, blocked flow, pressure control drift, or excessive load may be creating thermal stress.";
  }

  if (keys.has("vibration")) {
    return "Vibration anomaly points to bearing wear, imbalance, shaft misalignment, or loose mounting.";
  }

  if (keys.has("temperature")) {
    return "Thermal stress may be caused by cooling inefficiency, overload, lubrication loss, or fouled heat-transfer surfaces.";
  }

  if (keys.has("pressure")) {
    return "Pressure deviation suggests a blocked filter, valve drift, pump instability, or process flow restriction.";
  }

  if (keys.has("energy") || keys.has("power")) {
    return "Energy intensity is likely driven by overload, mechanical drag, poor efficiency, or an abnormal operating recipe.";
  }

  if (keys.has("health") || keys.has("status") || keys.has("aiPrediction")) {
    return "Machine condition is degrading across health, status, or prediction signals and needs preventive inspection.";
  }

  return "No abnormal operating pattern is visible in the monitored signals.";
};

const inferRecommendedAction = (machine, issues) => {
  const keys = new Set(issues.map((issue) => issue.key));
  const actions = [];

  if (keys.has("temperature")) {
    actions.push("inspect cooling and lubrication");
  }

  if (keys.has("vibration")) {
    actions.push("run vibration analysis and check bearings, alignment, and mounts");
  }

  if (keys.has("pressure")) {
    actions.push("verify filters, valves, pump flow, and pressure sensors");
  }

  if (keys.has("energy") || keys.has("power")) {
    actions.push("reduce load and compare power draw against the normal production recipe");
  }

  if (keys.has("health") || keys.has("status") || keys.has("aiPrediction")) {
    actions.push("schedule maintenance based on current risk and prediction");
  }

  if (actions.length === 0) {
    return "Continue normal monitoring and keep the machine in the preventive maintenance cycle.";
  }

  const prefix =
    inferRiskLevel(machine, issues) === "Critical"
      ? "Stabilize the asset, reduce load if safe, and "
      : "Plan an inspection to ";

  return `${prefix}${actions.join("; ")}.`;
};

export const createMachineInsight = (machine) => {
  const issues = analyzeIssues(machine);
  const riskLevel = inferRiskLevel(machine, issues);

  return {
    machineId: machine.machineId,
    name: getMachineLabel(machine),
    department: machine.department || "Production",
    status: machine.status || "Unknown",
    health: round(machine.health, 0),
    temperature: round(machine.temperature),
    vibration: round(machine.vibration, 2),
    pressure: round(machine.pressure, 2),
    power: round(machine.power),
    energy: round(getEnergy(machine)),
    efficiency: round(machine.efficiency, 0),
    aiPrediction: machine.aiPrediction || null,
    riskLevel,
    priority: getPriority(riskLevel),
    possibleCause: inferPossibleCause(machine, issues),
    recommendedAction: inferRecommendedAction(machine, issues),
    estimatedDowntime: getEstimatedDowntime(riskLevel),
    issues,
  };
};

const sortByRisk = (insights) =>
  [...insights].sort((a, b) => {
    const riskDiff = riskWeight[b.riskLevel] - riskWeight[a.riskLevel];

    if (riskDiff !== 0) {
      return riskDiff;
    }

    return a.health - b.health || b.temperature - a.temperature;
  });

const getSummaryBuckets = (insights) => {
  const critical = insights.filter(
    (machine) =>
      machine.riskLevel === "Critical" ||
      machine.status === "Critical" ||
      machine.health < 40
  );

  const warning = insights.filter(
    (machine) =>
      !critical.includes(machine) &&
      (machine.riskLevel === "High" ||
        machine.riskLevel === "Medium" ||
        machine.status === "Warning" ||
        machine.status === "Offline" ||
        machine.health < 80)
  );

  const healthy = insights.filter(
    (machine) => !critical.includes(machine) && !warning.includes(machine)
  );

  return { healthy, warning, critical };
};

export const buildPlantSummary = (machines) => {
  const insights = machines.map(createMachineInsight);
  const sorted = sortByRisk(insights);
  const buckets = getSummaryBuckets(insights);
  const healthValues = insights.map((machine) => machine.health);
  const averageHealth =
    healthValues.length > 0
      ? round(
          healthValues.reduce((total, value) => total + value, 0) /
            healthValues.length,
          1
        )
      : 0;

  const highestTemperature =
    [...insights].sort((a, b) => b.temperature - a.temperature)[0] || null;
  const highestEnergyConsumption =
    [...insights].sort((a, b) => b.energy - a.energy)[0] || null;
  const topRisk = sorted[0] || null;

  return {
    totalMachines: insights.length,
    healthyMachines: buckets.healthy.length,
    warningMachines: buckets.warning.length,
    criticalMachines: buckets.critical.length,
    averageHealth,
    highestTemperature: highestTemperature
      ? {
          machineId: highestTemperature.machineId,
          name: highestTemperature.name,
          value: highestTemperature.temperature,
          unit: "C",
        }
      : null,
    highestEnergyConsumption: highestEnergyConsumption
      ? {
          machineId: highestEnergyConsumption.machineId,
          name: highestEnergyConsumption.name,
          value: highestEnergyConsumption.energy,
          unit: "kWh",
        }
      : null,
    topRiskMachine: topRisk
      ? {
          machineId: topRisk.machineId,
          name: topRisk.name,
          riskLevel: topRisk.riskLevel,
          priority: topRisk.priority,
        }
      : null,
  };
};

const findReferencedMachine = (message, machines) => {
  const normalized = message.toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]/g, "");

  const directMatch = machines.find((machine) => {
    const name = String(machine.name || "").toLowerCase();
    const machineId = String(machine.machineId || "").toLowerCase();

    return (
      (name && normalized.includes(name)) ||
      (machineId && normalized.includes(machineId)) ||
      (name && compact.includes(name.replace(/[^a-z0-9]/g, ""))) ||
      (machineId && compact.includes(machineId.replace(/[^a-z0-9]/g, "")))
    );
  });

  if (directMatch) {
    return directMatch;
  }

  const numericMatch = normalized.match(
    /\b(?:machine|unit|asset|equipment|m)[-\s_#]*(\d{1,3})\b/
  );

  if (!numericMatch) {
    return null;
  }

  const rawNumber = numericMatch[1];
  const paddedTwo = rawNumber.padStart(2, "0");
  const paddedThree = rawNumber.padStart(3, "0");
  const machineIdCandidate = `m${paddedThree}`;

  return (
    machines.find(
      (machine) => String(machine.machineId || "").toLowerCase() === machineIdCandidate
    ) ||
    machines.find((machine) =>
      String(machine.name || "")
        .toLowerCase()
        .match(new RegExp(`(?:-|\\b)${paddedTwo}\\b|(?:-|\\b)${paddedThree}\\b`))
    ) ||
    null
  );
};

const formatRecommendation = (recommendation) =>
  [
    `Possible cause: ${recommendation.possibleCause}`,
    `Risk level: ${recommendation.riskLevel}`,
    `Recommended action: ${recommendation.recommendedAction}`,
    `Priority: ${recommendation.priority}`,
    `Estimated downtime: ${recommendation.estimatedDowntime}`,
  ].join("\n");

const formatMachineMetrics = (machine) =>
  `${machine.name} (${machine.machineId}) is ${machine.status} with ${machine.health}% health, ${machine.temperature} C temperature, ${machine.vibration} vibration, ${machine.pressure} bar pressure, and ${machine.energy} kWh energy consumption.`;

const buildMachineAnswer = (machineInsight, message) => {
  const dominantIssue = getDominantIssue(machineInsight.issues);
  const opening = dominantIssue
    ? `${formatMachineMetrics(machineInsight)} ${dominantIssue.message}`
    : `${formatMachineMetrics(machineInsight)} Signals are currently inside the normal operating band.`;

  const intentLine = includesAny(message, ["overheat", "overheating", "hot", "temperature"])
    ? "The overheating check focuses on temperature, vibration, pressure, and load together."
    : includesAny(message, ["vibration", "anomaly"])
      ? "The vibration check focuses on bearing, alignment, and mounting indicators."
      : "The maintenance assessment combines sensor data, status, health, and AI prediction.";

  return `${opening}\n\n${intentLine}\n\n${formatRecommendation(machineInsight)}`;
};

const buildUnhealthyAnswer = (insights) => {
  if (insights.length === 0) {
    return `No unhealthy machines were found. All machines are currently healthy or running within accepted thresholds.\n\n${formatRecommendation({
      possibleCause: "No active degradation pattern is visible.",
      riskLevel: "Low",
      recommendedAction: "Continue live monitoring and preventive maintenance.",
      priority: "Monitor",
      estimatedDowntime: "Under 1 hour",
    })}`;
  }

  const lines = insights.map(
    (machine, index) =>
      `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.riskLevel} risk, ${machine.health}% health, status ${machine.status}. ${machine.issues[0]?.message || "Needs inspection."}`
  );

  const lead = insights[0];

  return `Unhealthy machines found:\n${lines.join("\n")}\n\n${formatRecommendation({
    possibleCause: lead.possibleCause,
    riskLevel: lead.riskLevel,
    recommendedAction:
      "Start with the highest-risk machine, then inspect all warning assets before the next production shift.",
    priority: lead.priority,
    estimatedDowntime: lead.estimatedDowntime,
  })}`;
};

const buildPlantSummaryAnswer = (summary, sortedInsights) => {
  const topRisk = sortedInsights[0];
  const highestTemperature = summary.highestTemperature;
  const highestEnergy = summary.highestEnergyConsumption;

  return `Plant summary:\nHealthy machines: ${summary.healthyMachines}\nWarning machines: ${summary.warningMachines}\nCritical machines: ${summary.criticalMachines}\nAverage health: ${summary.averageHealth}%\nHighest temperature: ${
    highestTemperature
      ? `${highestTemperature.name} at ${highestTemperature.value} ${highestTemperature.unit}`
      : "No data"
  }\nHighest energy consumption: ${
    highestEnergy ? `${highestEnergy.name} at ${highestEnergy.value} ${highestEnergy.unit}` : "No data"
  }\n\n${formatRecommendation({
    possibleCause: topRisk
      ? topRisk.possibleCause
      : "No active degradation pattern is visible.",
    riskLevel: topRisk?.riskLevel || "Low",
    recommendedAction: topRisk
      ? `Prioritize ${topRisk.name} and keep warning machines under closer observation.`
      : "Continue live monitoring and planned preventive maintenance.",
    priority: topRisk?.priority || "Monitor",
    estimatedDowntime: topRisk?.estimatedDowntime || "Under 1 hour",
  })}`;
};

const buildFailurePredictionAnswer = (insights) => {
  const likelyFailures = insights.filter(
    (machine) =>
      machine.riskLevel === "Critical" ||
      machine.aiPrediction?.maintenanceInDays <= 1
  );

  if (likelyFailures.length === 0) {
    const topRisk = insights[0];

    return `No machine currently shows a strong failure signal for the next 24 hours. The closest watch item is ${
      topRisk?.name || "not available"
    }.\n\n${formatRecommendation({
      possibleCause: topRisk?.possibleCause || "No severe degradation pattern is visible.",
      riskLevel: topRisk?.riskLevel || "Low",
      recommendedAction:
        "Keep live monitoring enabled and review warning machines before the next shift.",
      priority: topRisk?.priority || "Monitor",
      estimatedDowntime: topRisk?.estimatedDowntime || "Under 1 hour",
    })}`;
  }

  const lines = likelyFailures.map(
    (machine, index) =>
      `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.riskLevel} risk, prediction: ${
        machine.aiPrediction?.failureRisk || "High"
      }, maintenance window: ${machine.aiPrediction?.maintenanceInDays ?? 1} day(s).`
  );
  const lead = likelyFailures[0];

  return `Machines at risk in the next 24 hours:\n${lines.join("\n")}\n\n${formatRecommendation({
    possibleCause: lead.possibleCause,
    riskLevel: lead.riskLevel,
    recommendedAction:
      "Prepare a controlled shutdown window, inspect the top-risk asset first, and keep spares ready.",
    priority: lead.priority,
    estimatedDowntime: lead.estimatedDowntime,
  })}`;
};

const buildMaintenancePlanAnswer = (insights) => {
  const maintenanceItems = insights.filter((machine) => machine.riskLevel !== "Low");
  const planItems = maintenanceItems.length > 0 ? maintenanceItems : insights.slice(0, 3);

  const lines = planItems.map((machine, index) => {
    const window =
      machine.priority === "Immediate"
        ? "today"
        : machine.priority === "High"
          ? "within 48 hours"
          : "within 7 days";

    return `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.priority} priority, service ${window}, expected downtime ${machine.estimatedDowntime}.`;
  });
  const lead = planItems[0];

  return `Maintenance schedule:\n${lines.join("\n")}\n\n${formatRecommendation({
    possibleCause: lead?.possibleCause || "No active degradation pattern is visible.",
    riskLevel: lead?.riskLevel || "Low",
    recommendedAction:
      "Assign maintenance by priority, inspect critical assets first, and keep production load reduced during service windows.",
    priority: lead?.priority || "Monitor",
    estimatedDowntime: lead?.estimatedDowntime || "Under 1 hour",
  })}`;
};

const buildVibrationAnswer = (insights) => {
  const vibrationMachines = insights
    .filter((machine) => machine.vibration >= thresholds.vibrationWarning)
    .sort((a, b) => b.vibration - a.vibration);
  const candidates = vibrationMachines.length > 0 ? vibrationMachines : insights;
  const lead = candidates[0];

  if (!lead) {
    return `No vibration data is available.\n\n${formatRecommendation({
      possibleCause: "Sensor data is unavailable.",
      riskLevel: "Low",
      recommendedAction: "Verify telemetry ingestion before making a maintenance decision.",
      priority: "Monitor",
      estimatedDowntime: "Under 1 hour",
    })}`;
  }

  const lines = candidates.slice(0, 5).map(
    (machine, index) =>
      `${index + 1}. ${machine.name} (${machine.machineId}) - vibration ${machine.vibration}, ${machine.riskLevel} risk.`
  );

  return `Vibration anomaly analysis:\n${lines.join("\n")}\n\n${formatRecommendation({
    possibleCause: lead.possibleCause,
    riskLevel: lead.riskLevel,
    recommendedAction:
      "Check bearings, alignment, fasteners, foundation condition, and lubrication before returning to full load.",
    priority: lead.priority,
    estimatedDowntime: lead.estimatedDowntime,
  })}`;
};

const buildCriticalAnswer = (insights) => {
  const criticalMachines = insights.filter(
    (machine) => machine.riskLevel === "Critical" || machine.status === "Critical"
  );

  if (criticalMachines.length === 0) {
    return `No critical machines are active right now.\n\n${formatRecommendation({
      possibleCause: "No critical pattern is visible in live machine data.",
      riskLevel: "Low",
      recommendedAction: "Continue monitoring warning machines and keep alerts enabled.",
      priority: "Monitor",
      estimatedDowntime: "Under 1 hour",
    })}`;
  }

  const lines = criticalMachines.map(
    (machine, index) =>
      `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.health}% health, ${machine.temperature} C, ${machine.vibration} vibration.`
  );
  const lead = criticalMachines[0];

  return `Critical machines:\n${lines.join("\n")}\n\n${formatRecommendation({
    possibleCause: lead.possibleCause,
    riskLevel: lead.riskLevel,
    recommendedAction: lead.recommendedAction,
    priority: lead.priority,
    estimatedDowntime: lead.estimatedDowntime,
  })}`;
};

const detectIntent = (message) => {
  const normalized = message.toLowerCase();

  if (includesAny(normalized, ["plant summary", "summarize plant", "plant status", "overall plant", "factory status", "report"])) {
    return "plant_summary";
  }

  if (includesAny(normalized, ["unhealthy", "not healthy", "bad machines"])) {
    return "unhealthy";
  }

  if (includesAny(normalized, ["critical", "emergency"])) {
    return "critical";
  }

  if (includesAny(normalized, ["next 24", "24 hours", "predict failure", "failure prediction", "failures"])) {
    return "failure_prediction";
  }

  if (includesAny(normalized, ["maintenance plan", "maintenance schedule", "which machines need maintenance", "need maintenance", "generate maintenance"])) {
    return "maintenance_plan";
  }

  if (includesAny(normalized, ["vibration", "anomaly"])) {
    return "vibration";
  }

  return "machine_or_general";
};

export const buildCopilotResponse = (message, machines) => {
  const trimmedMessage = String(message || "").trim();
  const insights = sortByRisk(machines.map(createMachineInsight));
  const summary = buildPlantSummary(machines);
  const intent = detectIntent(trimmedMessage);
  const referencedMachine = findReferencedMachine(trimmedMessage, machines);
  const referencedInsight = referencedMachine
    ? createMachineInsight(referencedMachine)
    : null;

  if (machines.length === 0) {
    return {
      intent,
      answer:
        "No machine telemetry is available yet. Connect MongoDB machine data or seed the plant dataset before running maintenance analysis.",
      recommendation: {
        possibleCause: "Machine dataset is empty.",
        riskLevel: "Low",
        recommendedAction: "Verify database connection and telemetry ingestion.",
        priority: "Monitor",
        estimatedDowntime: "Under 1 hour",
      },
      summary,
      affectedMachines: [],
      generatedAt: new Date().toISOString(),
    };
  }

  if (referencedInsight) {
    return {
      intent: "machine_diagnosis",
      answer: buildMachineAnswer(referencedInsight, trimmedMessage.toLowerCase()),
      recommendation: {
        possibleCause: referencedInsight.possibleCause,
        riskLevel: referencedInsight.riskLevel,
        recommendedAction: referencedInsight.recommendedAction,
        priority: referencedInsight.priority,
        estimatedDowntime: referencedInsight.estimatedDowntime,
      },
      summary,
      affectedMachines: [referencedInsight],
      generatedAt: new Date().toISOString(),
    };
  }

  const unhealthyInsights = insights.filter(
    (machine) => machine.health < 60 || !isHealthyStatus(machine.status)
  );

  let answer;
  let affectedMachines;

  if (intent === "plant_summary") {
    answer = buildPlantSummaryAnswer(summary, insights);
    affectedMachines = insights.slice(0, 5);
  } else if (intent === "unhealthy") {
    answer = buildUnhealthyAnswer(unhealthyInsights);
    affectedMachines = unhealthyInsights;
  } else if (intent === "critical") {
    answer = buildCriticalAnswer(insights);
    affectedMachines = insights.filter(
      (machine) => machine.riskLevel === "Critical" || machine.status === "Critical"
    );
  } else if (intent === "failure_prediction") {
    answer = buildFailurePredictionAnswer(insights);
    affectedMachines = insights.filter(
      (machine) =>
        machine.riskLevel === "Critical" ||
        machine.aiPrediction?.maintenanceInDays <= 1
    );
  } else if (intent === "maintenance_plan") {
    answer = buildMaintenancePlanAnswer(insights);
    affectedMachines = insights.filter((machine) => machine.riskLevel !== "Low");
  } else if (intent === "vibration") {
    answer = buildVibrationAnswer(insights);
    affectedMachines = insights.filter(
      (machine) => machine.vibration >= thresholds.vibrationWarning
    );
  } else {
    answer = buildPlantSummaryAnswer(summary, insights);
    affectedMachines = insights.slice(0, 5);
  }

  const lead = affectedMachines[0] || insights[0];

  return {
    intent,
    answer,
    recommendation: {
      possibleCause: lead?.possibleCause || "No active degradation pattern is visible.",
      riskLevel: lead?.riskLevel || "Low",
      recommendedAction:
        lead?.recommendedAction ||
        "Continue live monitoring and planned preventive maintenance.",
      priority: lead?.priority || "Monitor",
      estimatedDowntime: lead?.estimatedDowntime || "Under 1 hour",
    },
    summary,
    affectedMachines,
    suggestedQuestions: [
      "Show unhealthy machines",
      "Predict failures in next 24 hours",
      "Generate maintenance plan",
      "Summarize plant status",
    ],
    generatedAt: new Date().toISOString(),
  };
};

export const buildCopilotReport = (machines) => {
  const insights = sortByRisk(machines.map(createMachineInsight));
  const summary = buildPlantSummary(machines);
  const riskDistribution = insights.reduce(
    (acc, machine) => {
      acc[machine.riskLevel] += 1;
      return acc;
    },
    { Low: 0, Medium: 0, High: 0, Critical: 0 }
  );

  const criticalAlerts = insights
    .filter((machine) => machine.riskLevel === "Critical" || machine.riskLevel === "High")
    .map((machine) => ({
      machineId: machine.machineId,
      name: machine.name,
      riskLevel: machine.riskLevel,
      issue: machine.issues[0]?.message || "Maintenance attention required.",
      recommendedAction: machine.recommendedAction,
      priority: machine.priority,
    }));

  const maintenanceSchedule = insights
    .filter((machine) => machine.riskLevel !== "Low")
    .map((machine) => ({
      machineId: machine.machineId,
      name: machine.name,
      priority: machine.priority,
      riskLevel: machine.riskLevel,
      estimatedDowntime: machine.estimatedDowntime,
      recommendedAction: machine.recommendedAction,
      dueInDays:
        machine.priority === "Immediate"
          ? 0
          : machine.priority === "High"
            ? 2
            : 7,
    }));

  return {
    reportId: `KAVACH-${Date.now()}`,
    title: "KAVACH AI Maintenance Copilot Report",
    generatedAt: new Date().toISOString(),
    plantSummary: summary,
    riskDistribution,
    criticalAlerts,
    maintenanceSchedule,
    machines: insights,
  };
};
