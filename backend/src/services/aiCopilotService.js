import {
  buildCopilotReport,
  buildCopilotResponse,
  buildPlantSummary,
  createMachineInsight,
} from "./copilotAnalysisService.js";
import { buildPredictiveOverview } from "./predictionService.js";

const getContextMachines = (contextOrMachines) =>
  Array.isArray(contextOrMachines)
    ? contextOrMachines
    : contextOrMachines?.machines || [];

const includesAny = (message, terms) =>
  terms.some((term) => message.includes(term));

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

const formatRecommendation = (prediction) => ({
  possibleCause:
    prediction?.probableCause ||
    "No active degradation pattern is visible in live telemetry.",
  riskLevel: prediction?.riskLevel || "Low",
  recommendedAction:
    prediction?.recommendation ||
    "Continue live monitoring and planned preventive maintenance.",
  priority: prediction?.maintenancePriority || "Monitor",
  estimatedDowntime: prediction
    ? `${prediction.estimatedDowntimeHours} hours`
    : "Under 1 hour",
});

const buildFailureLeaderResponse = (message, machines) => {
  const overview = buildPredictiveOverview(machines);
  const leader = overview.predictions[0];

  if (!leader) {
    return null;
  }

  return {
    intent: "failure_prediction_explanation",
    answer: [
      `Most likely failure candidate: ${leader.name} (${leader.machineId})`,
      "",
      `Failure Probability: ${leader.failureProbability}%`,
      `Remaining Useful Life: ${leader.remainingUsefulLifeHours} hours`,
      `Maintenance Priority: ${leader.maintenancePriority}`,
      `Confidence Score: ${leader.aiConfidence}%`,
      `Risk Trend: ${leader.trendDirection}`,
      "",
      `Root Cause: ${leader.probableCause}`,
      `Recommendation: ${leader.recommendation}`,
      "",
      "This assessment uses live MongoDB machine telemetry, status, health, pressure, vibration, temperature, energy draw, and stored AI prediction signals.",
    ].join("\n"),
    recommendation: formatRecommendation(leader),
    summary: buildPlantSummary(machines),
    affectedMachines: [createMachineInsight(machines.find((machine) => machine.machineId === leader.machineId))],
    suggestedQuestions: [
      `Why is ${leader.machineId} risky?`,
      "Show unhealthy machines",
      "Generate today's maintenance report",
      "Which department consumes most energy?",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const buildCriticalAlertsResponse = (machines, context = {}) => {
  const alerts = (context.notifications || []).filter((notification) =>
    ["Critical", "High"].includes(notification.severity)
  );
  const topAlerts = alerts.slice(0, 8);

  return {
    intent: "critical_alerts",
    answer: [
      `Critical alert count: ${topAlerts.length}`,
      "",
      ...(topAlerts.length
        ? topAlerts.map(
            (alert, index) =>
              `${index + 1}. ${alert.machineName} (${alert.machineId}) - ${alert.severity}: ${alert.message}`
          )
        : ["No critical or high severity alerts are currently active."]),
      "",
      "Recommended action: prioritize unresolved Critical alerts, check linked work orders, and verify live telemetry before shift handoff.",
    ].join("\n"),
    recommendation: formatRecommendation(
      context.predictiveOverview?.predictions?.[0]
    ),
    summary: buildPlantSummary(machines),
    affectedMachines: topAlerts
      .map((alert) =>
        createMachineInsight(
          machines.find((machine) => machine.machineId === alert.machineId)
        )
      )
      .filter(Boolean),
    suggestedQuestions: [
      "Which alert is highest priority?",
      "Create a maintenance plan",
      "Show unhealthy machines",
      "Explain the top failure risk",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const buildOeeExplanationResponse = (machines, context = {}) => {
  const kpis = context.executiveDashboard?.kpis || {};

  return {
    intent: "oee_explanation",
    answer: [
      "OEE combines Availability, Performance, and Quality into one plant effectiveness score.",
      "",
      `Current OEE: ${kpis.oee ?? 0}%`,
      `Availability: ${kpis.availability ?? 0}%`,
      `Performance: ${kpis.performance ?? kpis.productionEfficiency ?? 0}%`,
      `Quality: ${kpis.quality ?? kpis.health ?? 0}%`,
      "",
      "Formula: OEE = Availability x Performance x Quality.",
      "",
      "For maintenance teams, a falling OEE usually means downtime, speed loss, quality loss, or a combination of all three. Compare the OEE trend against active alerts and work orders before deciding whether to reduce load or schedule inspection.",
    ].join("\n"),
    recommendation: formatRecommendation(
      context.predictiveOverview?.predictions?.[0]
    ),
    summary: buildPlantSummary(machines),
    affectedMachines: [],
    suggestedQuestions: [
      "Which department has lowest OEE?",
      "Show downtime trend",
      "Which machine is hurting OEE?",
      "Energy optimization suggestions",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const buildWeeklyFailureResponse = (machines, context = {}) => {
  const overview = context.predictiveOverview || buildPredictiveOverview(machines);
  const candidates = overview.predictions
    .filter((prediction) => prediction.remainingUsefulLifeHours <= 168)
    .slice(0, 8);

  return {
    intent: "weekly_failure_prediction",
    answer: [
      "Failure forecast for this week",
      "",
      ...(candidates.length
        ? candidates.map(
            (machine, index) =>
              `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.riskLevel}, failure probability ${machine.failureProbability}%, RUL ${machine.remainingUsefulLifeHours}h, priority ${machine.maintenancePriority}.`
          )
        : ["No machine is predicted to fail inside the next 7 days."]),
      "",
      candidates[0]
        ? `First action: ${candidates[0].recommendation}`
        : "First action: continue routine monitoring and keep weekly preventive checks on schedule.",
    ].join("\n"),
    recommendation: formatRecommendation(candidates[0] || overview.predictions[0]),
    summary: buildPlantSummary(machines),
    affectedMachines: candidates.map((candidate) =>
      createMachineInsight(
        machines.find((machine) => machine.machineId === candidate.machineId) ||
          candidate
      )
    ),
    predictiveOverview: overview,
    suggestedQuestions: [
      "Which machine needs maintenance first?",
      "Generate maintenance schedule",
      "Show critical alerts",
      "Explain top risk machine",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const buildEnergyResponse = (machines) => {
  const departmentEnergy = Object.values(
    machines.reduce((acc, machine) => {
      const department = machine.department || "Production";
      const energy = getEnergy(machine);

      acc[department] ||= {
        department,
        energy: 0,
        machines: [],
      };
      acc[department].energy += energy;
      acc[department].machines.push(machine);

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
  const leader = departmentEnergy[0];
  const topMachine = [...machines].sort((a, b) => getEnergy(b) - getEnergy(a))[0];

  return {
    intent: "energy_analysis",
    answer: [
      `Highest energy department: ${leader?.department || "No department data"}`,
      "",
      ...departmentEnergy.slice(0, 5).map(
        (item, index) =>
          `${index + 1}. ${item.department}: ${item.energy} kWh, estimated cost $${item.cost}, carbon ${item.carbonKg} kg CO2e`
      ),
      "",
      topMachine
        ? `Top consuming machine: ${topMachine.name} (${topMachine.machineId}) at ${round(getEnergy(topMachine), 1)} kWh.`
        : "Top consuming machine: No machine telemetry available.",
      "",
      "Recommendation: Review loading, lubrication, cooling demand, and production recipe variance for the highest energy department before the next shift review.",
    ].join("\n"),
    recommendation: {
      possibleCause:
        "Energy intensity is usually driven by overload, mechanical drag, cooling inefficiency, friction, or nonstandard production recipes.",
      riskLevel: leader?.energy >= 850 ? "High" : leader?.energy >= 600 ? "Medium" : "Low",
      recommendedAction:
        "Run department-level energy review, compare high-draw machines against normal recipes, and schedule maintenance for assets with high energy plus poor health.",
      priority: leader?.energy >= 850 ? "High" : "Planned",
      estimatedDowntime: "1-2 hours",
    },
    summary: buildPlantSummary(machines),
    affectedMachines: topMachine ? [createMachineInsight(topMachine)] : [],
    energyAnalysis: departmentEnergy,
    suggestedQuestions: [
      "Show highest energy machines",
      "Generate energy report",
      "Which machines need maintenance?",
      "Show unhealthy machines",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const buildMaintenanceReportResponse = (message, machines) => {
  const overview = buildPredictiveOverview(machines);
  const report = buildCopilotReport(machines);
  const critical = overview.predictions.filter((machine) =>
    ["Critical", "High"].includes(machine.riskLevel)
  );
  const period = includesAny(message, ["weekly", "week"])
    ? "Weekly"
    : includesAny(message, ["monthly", "month"])
      ? "Monthly"
      : "Daily";

  return {
    intent: `${period.toLowerCase()}_maintenance_report`,
    answer: [
      `${period} Maintenance Report`,
      `Generated: ${new Date().toISOString()}`,
      "",
      `Total Machines: ${overview.summary.totalMachines}`,
      `Average Health: ${overview.summary.machineHealth}%`,
      `Average Failure Probability: ${overview.summary.failureProbability}%`,
      `Plant Risk Level: ${overview.summary.riskLevel}`,
      `High Risk Machines: ${overview.summary.highRiskMachines}`,
      "",
      "Maintenance Priorities:",
      ...(critical.length
        ? critical.map(
            (machine, index) =>
              `${index + 1}. ${machine.name} (${machine.machineId}) - ${machine.riskLevel}, RUL ${machine.remainingUsefulLifeHours}h, ${machine.recommendation}`
          )
        : ["No high-risk machine requires immediate intervention."]),
      "",
      "Executive Summary:",
      `The plant is operating at ${overview.summary.machineHealth}% average health with ${report.plantSummary.warningMachines} warning machines and ${report.plantSummary.criticalMachines} critical machines. Maintenance should focus on assets with rising failure probability and shrinking RUL.`,
    ].join("\n"),
    recommendation: formatRecommendation(overview.predictions[0]),
    summary: report.plantSummary,
    affectedMachines: critical.map((machine) =>
      createMachineInsight(
        machines.find((item) => item.machineId === machine.machineId) || machine
      )
    ),
    report,
    predictiveOverview: overview,
    suggestedQuestions: [
      "Download maintenance PDF",
      "Which machine is most likely to fail?",
      "Which department consumes most energy?",
      "Show critical machines",
    ],
    generatedAt: new Date().toISOString(),
  };
};

const getLocalCopilotResponse = (message, contextOrMachines) => {
  const machines = getContextMachines(contextOrMachines);
  const context = Array.isArray(contextOrMachines) ? { machines } : contextOrMachines;
  const normalized = String(message || "").trim().toLowerCase();

  if (
    includesAny(normalized, [
      "critical alerts",
      "show alerts",
      "active alerts",
      "alert summary",
    ])
  ) {
    return buildCriticalAlertsResponse(machines, context);
  }

  if (includesAny(normalized, ["explain oee", "what is oee", "oee"])) {
    return buildOeeExplanationResponse(machines, context);
  }

  if (
    includesAny(normalized, [
      "this week",
      "next week",
      "predict failures",
      "failures this week",
      "failure this week",
    ])
  ) {
    return buildWeeklyFailureResponse(machines, context);
  }

  if (
    includesAny(normalized, [
      "most likely to fail",
      "likely to fail",
      "highest failure",
      "failure explanation",
      "failure prediction explanation",
    ])
  ) {
    return buildFailureLeaderResponse(normalized, machines);
  }

  if (
    includesAny(normalized, [
      "energy",
      "consumes most",
      "consumption",
      "carbon",
      "cost",
    ])
  ) {
    return buildEnergyResponse(machines);
  }

  if (
    includesAny(normalized, [
      "today's maintenance report",
      "todays maintenance report",
      "daily summary",
      "weekly report",
      "monthly report",
      "maintenance report",
      "plant health report",
    ])
  ) {
    return buildMaintenanceReportResponse(normalized, machines);
  }

  return buildCopilotResponse(message, machines);
};

export const buildAiProviderPayload = (message, contextOrMachines) => {
  const machines = getContextMachines(contextOrMachines);
  const context = Array.isArray(contextOrMachines)
    ? { machines }
    : contextOrMachines;

  return {
    provider: process.env.OPENAI_API_KEY
      ? "openai"
      : process.env.AI_PROVIDER || "local-rule-engine",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are KAVACH, an industrial maintenance copilot. Use only supplied machine telemetry and format responses for plant operations teams.",
      },
      {
        role: "user",
        content: message,
      },
    ],
    context: {
      machineCount: machines.length,
      machines: machines.map((machine) => ({
        machineId: machine.machineId,
        name: machine.name,
        department: machine.department,
        status: machine.status,
        health: machine.health,
        temperature: machine.temperature,
        vibration: machine.vibration,
        pressure: machine.pressure,
        current: machine.current,
        voltage: machine.voltage,
        rpm: machine.rpm,
        oilLevel: machine.oilLevel,
        noise: machine.noise,
        flowRate: machine.flowRate,
        gasSensor: machine.gasSensor,
        telemetrySource: machine.telemetrySource,
        linkedDeviceId: machine.linkedDeviceId,
        energyConsumed: getEnergy(machine),
      })),
      alerts: (context.notifications || []).slice(0, 20),
      workOrders: (context.workOrders || []).slice(0, 20),
      predictiveSummary: context.predictiveOverview?.summary || null,
      executiveKpis: context.executiveDashboard?.kpis || null,
    },
  };
};

const buildOpenAiPrompt = (message, context) => {
  const payload = buildAiProviderPayload(message, context);

  return [
    payload.messages[0],
    {
      role: "user",
      content: [
        payload.messages[1].content,
        "",
        "Live machine context:",
        JSON.stringify(payload.context, null, 2),
      ].join("\n"),
    },
  ];
};

const callOpenAiCopilot = async (message, context) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: buildOpenAiPrompt(message, context),
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with ${response.status}`);
  }

  const body = await response.json();
  return body.choices?.[0]?.message?.content?.trim();
};

export const buildAiCopilotResponse = async (message, contextOrMachines) => {
  const response = getLocalCopilotResponse(message, contextOrMachines);
  const providerPayload = buildAiProviderPayload(message, contextOrMachines);

  if (process.env.OPENAI_API_KEY) {
    try {
      const openAiAnswer = await callOpenAiCopilot(message, contextOrMachines);

      if (openAiAnswer) {
        return {
          ...response,
          answer: openAiAnswer,
          provider: "openai",
          providerPayload,
        };
      }
    } catch (error) {
      return {
        ...response,
        provider: "local-rule-engine",
        providerError:
          error instanceof Error
            ? error.message
            : "OpenAI provider failed; local rules were used.",
        providerPayload,
      };
    }
  }

  return {
    ...response,
    provider: process.env.AI_PROVIDER || "local-rule-engine",
    providerPayload,
  };
};
