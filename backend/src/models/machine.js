import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    failureRisk: String,
    maintenancePriority: String,
    maintenanceInDays: Number,
    recommendation: String,
  },
  { _id: false }
);

const maintenanceHistorySchema = new mongoose.Schema(
  {
    workOrderId: String,
    status: String,
    completedAt: Date,
    summary: String,
    engineer: String,
    notes: String,
  },
  { _id: false }
);

const predictionHistorySchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    failureProbability: Number,
    remainingUsefulLifeHours: Number,
    maintenancePriority: String,
    riskLevel: String,
    confidenceScore: Number,
  },
  { _id: false }
);

const aiRecommendationSummarySchema = new mongoose.Schema(
  {
    recommendation: String,
    confidence: Number,
    priority: String,
    rationale: String,
    expectedImpact: String,
  },
  { _id: false }
);

const aiIntelligenceSchema = new mongoose.Schema(
  {
    generatedAt: Date,
    anomaly: {
      detected: {
        type: Boolean,
        default: false,
      },
      severity: {
        type: String,
        default: "Low",
      },
      confidence: Number,
      severityScore: Number,
      reason: String,
    },
    healthPercent: Number,
    riskPercent: Number,
    confidencePercent: Number,
    remainingUsefulLifeHours: Number,
    remainingUsefulLifeDays: Number,
    failureProbability: Number,
    rootCauseSummary: String,
    topRootCauses: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    forecast: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    maintenancePlan: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendations: {
      type: [aiRecommendationSummarySchema],
      default: [],
    },
  },
  { _id: false }
);

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      default: "Production",
    },

    organizationId: {
      type: String,
      default: "",
      index: true,
    },

    tenantId: {
      type: String,
      default: "",
      index: true,
    },

    regionId: {
      type: String,
      default: "",
      index: true,
    },

    plantId: {
      type: String,
      default: "",
      index: true,
    },

    departmentId: {
      type: String,
      default: "",
      index: true,
    },

    productionLineId: {
      type: String,
      default: "",
      index: true,
    },

    machineGroupId: {
      type: String,
      default: "",
      index: true,
    },

    areaId: {
      type: String,
      default: "",
      index: true,
    },

    assetId: {
      type: String,
      default: "",
      index: true,
    },

    serialNumber: {
      type: String,
      default: "",
      index: true,
    },

    manufacturer: {
      type: String,
      default: "",
      index: true,
    },

    model: {
      type: String,
      default: "",
    },

    installationDate: Date,

    warrantyExpiry: Date,

    criticality: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
      index: true,
    },

    expectedLifeYears: {
      type: Number,
      default: 10,
    },

    assetValue: {
      type: Number,
      default: 0,
    },

    maintenanceCost: {
      type: Number,
      default: 0,
    },

    replacementCost: {
      type: Number,
      default: 0,
    },

    assetImage: {
      type: String,
      default: "",
    },

    qrCode: {
      type: String,
      default: "",
    },

    barcode: {
      type: String,
      default: "",
    },

    lifecycleState: {
      type: String,
      enum: [
        "Installed",
        "Commissioned",
        "Operational",
        "Maintenance",
        "Repair",
        "Upgrade",
        "Retirement",
        "Replacement",
      ],
      default: "Operational",
      index: true,
    },

    status: {
      type: String,
      enum: ["Running", "Warning", "Critical", "Offline", "Idle", "Maintenance"],
      default: "Running",
    },

    health: {
      type: Number,
      default: 100,
    },

    temperature: {
      type: Number,
      default: 25,
    },

    vibration: {
      type: Number,
      default: 0.2,
    },

    power: {
      type: Number,
      default: 0,
    },

    current: {
      type: Number,
      default: 0,
    },

    voltage: {
      type: Number,
      default: 415,
    },

    efficiency: {
      type: Number,
      default: 100,
    },

    rpm: {
      type: Number,
      default: 1500,
    },

    humidity: {
      type: Number,
      default: 45,
    },

    pressure: {
      type: Number,
      default: 1.0,
    },

    oilLevel: {
      type: Number,
      default: 100,
    },

    noise: {
      type: Number,
      default: 60,
    },

    flowRate: {
      type: Number,
      default: 0,
    },

    gasSensor: {
      type: Number,
      default: 0,
    },

    energyConsumed: {
      type: Number,
      default: 0,
    },

    downtime: {
      type: Number,
      default: 0,
    },

    oee: {
      type: Number,
      default: 100,
    },

    remainingUsefulLifeHours: {
      type: Number,
      default: 720,
    },

    predictedFailureProbability: {
      type: Number,
      default: 2,
    },

    telemetrySource: {
      type: String,
      enum: ["simulator", "iot", "manual"],
      default: "simulator",
      index: true,
    },

    liveTelemetryEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },

    linkedDeviceId: {
      type: String,
      default: "",
      index: true,
    },

    lastLiveTelemetryAt: Date,

    lastHeartbeat: {
      type: Date,
      default: Date.now,
    },

    aiPrediction: predictionSchema,

    predictionHistory: {
      type: [predictionHistorySchema],
      default: [],
    },

    maintenanceHistory: {
      type: [maintenanceHistorySchema],
      default: [],
    },

    aiIntelligence: aiIntelligenceSchema,

    aiHealthPercent: {
      type: Number,
      default: 100,
      index: true,
    },

    aiRiskPercent: {
      type: Number,
      default: 0,
      index: true,
    },

    aiFailureProbability: {
      type: Number,
      default: 0,
      index: true,
    },

    aiRemainingUsefulLifeHours: {
      type: Number,
      default: 720,
    },

    aiRootCauseSummary: {
      type: String,
      default: "",
    },

    aiAnomalySeverity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },

    aiConfidencePercent: {
      type: Number,
      default: 0,
    },

    aiLastAnalyzedAt: Date,
  },
  {
    timestamps: true,
  }
);

machineSchema.index({ department: 1, status: 1 });
machineSchema.index({ organizationId: 1, plantId: 1, status: 1 });
machineSchema.index({ plantId: 1, criticality: 1, lifecycleState: 1 });
machineSchema.index({ health: 1 });
machineSchema.index({ updatedAt: -1 });

export default mongoose.model("Machine", machineSchema);
