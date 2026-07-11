import Machine from "../models/machine.js";
import OnboardingProgress, { ONBOARDING_STEPS } from "../models/onboardingProgress.js";
import Organization from "../models/organization.js";
import Plant from "../models/plant.js";
import User from "../models/user.js";

const buildStepData = (payload = {}) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const normalizeCompletedSteps = (steps = []) =>
  Array.from(new Set(steps.map(String))).filter((step) =>
    ONBOARDING_STEPS.includes(step)
  );

const getNextStep = (completedSteps) =>
  ONBOARDING_STEPS.find((step) => !completedSteps.includes(step)) ||
  "dashboardReady";

export const validateOnboardingProgress = async ({ organizationId, tenantId }) => {
  const [organization, plants, machines, users] = await Promise.all([
    Organization.findById(organizationId).lean(),
    Plant.find({ organizationId, ...(tenantId ? { tenantId } : {}) }).lean(),
    Machine.find({ organizationId, ...(tenantId ? { tenantId } : {}) }).lean(),
    User.find({ organizationId, ...(tenantId ? { tenantId } : {}) }).lean(),
  ]);
  const errors = [];

  if (!organization) errors.push("Organization profile is required.");
  if (plants.length === 0) errors.push("At least one plant must be created.");
  if (machines.length === 0) errors.push("At least one machine must be registered or imported.");
  if (users.length === 0) errors.push("At least one team member must be assigned.");

  return {
    errors,
    stats: {
      machines: machines.length,
      organization: organization ? 1 : 0,
      plants: plants.length,
      users: users.length,
    },
  };
};

export const getOrCreateOnboardingProgress = async ({ organizationId, req }) => {
  const tenantId = req?.tenantContext?.tenantId || req?.user?.tenantId || "";

  return OnboardingProgress.findOneAndUpdate(
    { organizationId, tenantId },
    {
      $setOnInsert: {
        organizationId,
        tenantId,
      },
    },
    { new: true, setDefaultsOnInsert: true, upsert: true }
  );
};

export const saveOnboardingProgress = async ({ organizationId, payload = {}, req }) => {
  const tenantId = payload.tenantId || req?.tenantContext?.tenantId || req?.user?.tenantId || "";
  const completedSteps = normalizeCompletedSteps(payload.completedSteps || []);
  const currentStep = payload.currentStep || getNextStep(completedSteps);
  const validation = await validateOnboardingProgress({ organizationId, tenantId });
  const status =
    completedSteps.includes("dashboardReady") && validation.errors.length === 0
      ? "Completed"
      : "In Progress";

  return OnboardingProgress.findOneAndUpdate(
    { organizationId, tenantId },
    {
      completedAt: status === "Completed" ? new Date() : undefined,
      completedSteps,
      currentStep,
      demoDataEnabled: Boolean(payload.demoDataEnabled),
      lastAutosavedAt: new Date(),
      retryCount: Number(payload.retryCount || 0),
      status,
      stepData: buildStepData(payload.stepData || {}),
      validationErrors: validation.errors,
    },
    { new: true, runValidators: true, setDefaultsOnInsert: true, upsert: true }
  );
};

export const serializeOnboardingProgress = (progress) => {
  const value =
    progress && typeof progress.toObject === "function" ? progress.toObject() : progress;

  if (!value) {
    return null;
  }

  const completedSteps = normalizeCompletedSteps(value.completedSteps || []);

  return {
    ...value,
    _id: value._id ? String(value._id) : undefined,
    completedAt: value.completedAt ? new Date(value.completedAt).toISOString() : null,
    createdAt: value.createdAt ? new Date(value.createdAt).toISOString() : null,
    lastAutosavedAt: value.lastAutosavedAt
      ? new Date(value.lastAutosavedAt).toISOString()
      : null,
    progressPercent: Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100),
    steps: ONBOARDING_STEPS,
    updatedAt: value.updatedAt ? new Date(value.updatedAt).toISOString() : null,
  };
};
