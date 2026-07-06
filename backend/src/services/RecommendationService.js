import { clamp, round } from "./AIConfig.js";

const pushUnique = (items, item) => {
  if (!items.some((current) => current.recommendation === item.recommendation)) {
    items.push(item);
  }
};

export const generateRecommendations = ({
  anomaly,
  rootCause,
  rul,
  forecast,
  planner,
} = {}) => {
  const recommendations = [];
  const confidenceBase = clamp(
    ((anomaly?.confidence || 55) + (rootCause?.confidence || 55) + (rul?.confidence || 55)) / 3,
    45,
    96
  );
  const topCause = rootCause?.causes?.[0];
  const topCauseName = String(topCause?.cause || "").toLowerCase();

  if (planner?.priority === "Immediate") {
    pushUnique(recommendations, {
      recommendation: "Schedule controlled shutdown",
      confidence: round(confidenceBase + 3, 1),
      priority: "Immediate",
      rationale: "Risk level is high enough to require a protected maintenance window.",
      expectedImpact: "Reduces probability of unplanned downtime.",
    });
  }

  if ((forecast?.peakProbability || 0) >= 70 || (rul?.riskPercent || 0) >= 70) {
    pushUnique(recommendations, {
      recommendation: "Reduce machine load",
      confidence: round(confidenceBase, 1),
      priority: "High",
      rationale: "Forecasted failure probability is elevated in the near-term horizon.",
      expectedImpact: "Lowers thermal and electrical stress while maintenance is prepared.",
    });
  }

  if (topCauseName.includes("bearing")) {
    pushUnique(recommendations, {
      recommendation: "Replace bearing",
      confidence: round(confidenceBase + 4, 1),
      priority: planner?.priority || "High",
      rationale: "The dominant root-cause signature points to bearing wear.",
      expectedImpact: "Restores vibration stability and protects the motor shaft.",
    });
  }

  if (topCauseName.includes("lubrication") || (anomaly?.sensors || []).some((sensor) => sensor.sensor === "oilLevel" && sensor.status !== "Normal")) {
    pushUnique(recommendations, {
      recommendation: "Inspect lubrication",
      confidence: round(confidenceBase + 2, 1),
      priority: "High",
      rationale: "Oil-level or friction signatures indicate lubrication risk.",
      expectedImpact: "Reduces bearing heat, vibration, and wear rate.",
    });
  }

  if (topCauseName.includes("cooling") || (anomaly?.sensors || []).some((sensor) => sensor.sensor === "temperature" && sensor.status !== "Normal")) {
    pushUnique(recommendations, {
      recommendation: "Inspect cooling path",
      confidence: round(confidenceBase, 1),
      priority: "Planned",
      rationale: "Thermal drift can be caused by blocked filters, fans, or coolant flow issues.",
      expectedImpact: "Improves heat rejection and lowers motor insulation stress.",
    });
  }

  if (planner?.priority === "Monitor") {
    pushUnique(recommendations, {
      recommendation: "Delay maintenance",
      confidence: round(confidenceBase - 3, 1),
      priority: "Monitor",
      rationale: "Current telemetry is inside expected operating bands.",
      expectedImpact: "Avoids unnecessary downtime while preserving monitoring.",
    });
  }

  pushUnique(recommendations, {
    recommendation: "Increase monitoring frequency",
    confidence: round(confidenceBase - 1, 1),
    priority: planner?.priority === "Monitor" ? "Monitor" : "Planned",
    rationale: "Fresh telemetry improves confidence for follow-up decisions.",
    expectedImpact: "Improves anomaly confirmation and maintenance timing.",
  });

  return recommendations.slice(0, 6);
};
