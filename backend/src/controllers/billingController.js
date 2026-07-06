import Invoice from "../models/invoice.js";
import Plan from "../models/plan.js";
import Subscription from "../models/subscription.js";
import { createAuditLog } from "../services/auditService.js";
import {
  createSubscriptionInvoice,
  ensureDefaultPlans,
  getActiveSubscription,
  getTenantUsage,
} from "../services/billingService.js";

const getScope = (req) => ({
  organizationId:
    req.query.organizationId ||
    req.body.organizationId ||
    req.tenantContext?.organizationId ||
    "",
  tenantId:
    req.query.tenantId || req.body.tenantId || req.tenantContext?.tenantId || "",
});

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const listPlans = async (req, res) => {
  const plans = await ensureDefaultPlans();
  res.json({ plans, success: true });
};

export const getSubscription = async (req, res) => {
  const scope = getScope(req);
  const subscription = await getActiveSubscription(scope);
  const plan = subscription
    ? await Plan.findOne({ planId: subscription.planId }).lean()
    : null;
  const usage = await getTenantUsage(scope);

  res.json({
    plan,
    subscription,
    success: true,
    usage,
  });
};

export const upsertSubscription = async (req, res) => {
  const scope = getScope(req);
  const planId = String(req.body.planId || "").trim().toLowerCase();
  const billingCycle = req.body.billingCycle === "annual" ? "annual" : "monthly";
  const plan = await Plan.findOne({ planId, status: "active" }).lean();

  if (!scope.tenantId) {
    return res.status(400).json({ message: "Tenant ID is required" });
  }

  if (!plan) {
    return res.status(404).json({ message: "Plan not found" });
  }

  const now = new Date();
  const usage = await getTenantUsage(scope);
  const subscription = await Subscription.findOneAndUpdate(
    {
      tenantId: scope.tenantId,
      ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
    },
    {
      billingCycle,
      currentPeriodEnd: addMonths(now, billingCycle === "annual" ? 12 : 1),
      currentPeriodStart: now,
      organizationId: scope.organizationId,
      planId,
      status: "active",
      usage,
    },
    { new: true, runValidators: true, upsert: true }
  );
  const invoice = await createSubscriptionInvoice({ plan, subscription });

  await createAuditLog({
    action: "SUBSCRIPTION_UPDATED",
    metadata: { billingCycle, invoiceId: invoice.invoiceId, planId },
    req,
    resourceId: String(subscription._id),
    resourceType: "subscription",
  });

  res.status(201).json({
    invoice,
    plan,
    subscription,
    success: true,
  });
};

export const listInvoices = async (req, res) => {
  const scope = getScope(req);
  const invoices = await Invoice.find({
    ...(scope.tenantId ? { tenantId: scope.tenantId } : {}),
    ...(scope.organizationId ? { organizationId: scope.organizationId } : {}),
  })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 100, 500))
    .lean();

  res.json({ invoices, success: true });
};
