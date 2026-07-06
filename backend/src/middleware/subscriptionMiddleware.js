import Machine from "../models/machine.js";
import Plan from "../models/plan.js";
import Subscription from "../models/subscription.js";

export const enforceMachineLimit = async (req, res, next) => {
  try {
    const tenantId =
      req.body.tenantId || req.user?.tenantId || req.tenantContext?.tenantId || "";
    const organizationId =
      req.body.organizationId ||
      req.user?.organizationId ||
      req.tenantContext?.organizationId ||
      "";

    if (!tenantId && !organizationId) {
      return next();
    }

    const subscription = await Subscription.findOne({
      ...(tenantId ? { tenantId } : {}),
      ...(organizationId ? { organizationId } : {}),
      status: { $in: ["trialing", "active", "past_due"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscription) {
      return next();
    }

    const plan = await Plan.findOne({ planId: subscription.planId }).lean();

    if (!plan || !Number.isFinite(Number(plan.machineLimit))) {
      return next();
    }

    const machineCount = await Machine.countDocuments({
      ...(tenantId ? { tenantId } : {}),
      ...(organizationId ? { organizationId } : {}),
    });

    if (machineCount >= Number(plan.machineLimit)) {
      return res.status(402).json({
        limit: plan.machineLimit,
        message: "Machine limit reached for the active subscription plan",
        plan: plan.name,
        success: false,
        usage: machineCount,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
