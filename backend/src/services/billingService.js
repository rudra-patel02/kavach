import Invoice from "../models/invoice.js";
import Machine from "../models/machine.js";
import Plan from "../models/plan.js";
import Plant from "../models/plant.js";
import Subscription from "../models/subscription.js";
import User from "../models/user.js";

export const defaultPlans = [
  {
    annualPrice: 948,
    features: [
      "Single plant monitoring",
      "Predictive maintenance",
      "Audit logging",
      "Standard reports",
    ],
    machineLimit: 25,
    monthlyPrice: 99,
    name: "Starter",
    planId: "starter",
    plantLimit: 1,
    supportLevel: "standard",
    userLimit: 10,
  },
  {
    annualPrice: 2868,
    features: [
      "Multi-plant operations",
      "Advanced analytics",
      "Scheduled reports",
      "Priority support",
    ],
    machineLimit: 150,
    monthlyPrice: 299,
    name: "Professional",
    planId: "professional",
    plantLimit: 5,
    supportLevel: "priority",
    userLimit: 50,
  },
  {
    annualPrice: 0,
    features: [
      "Unlimited enterprise scale",
      "Dedicated success support",
      "Custom retention",
      "Advanced security controls",
    ],
    machineLimit: 10000,
    monthlyPrice: 0,
    name: "Enterprise",
    planId: "enterprise",
    plantLimit: 250,
    supportLevel: "dedicated",
    userLimit: 10000,
  },
];

export const ensureDefaultPlans = async () => {
  await Promise.all(
    defaultPlans.map((plan) =>
      Plan.updateOne(
        { planId: plan.planId },
        { $setOnInsert: plan },
        { upsert: true }
      )
    )
  );

  return Plan.find({ status: "active" }).sort({ monthlyPrice: 1 }).lean();
};

export const getTenantUsage = async ({ organizationId = "", tenantId = "" }) => {
  const scope = {
    ...(tenantId ? { tenantId } : {}),
    ...(organizationId ? { organizationId } : {}),
  };
  const [machines, users, plants] = await Promise.all([
    Machine.countDocuments(scope),
    User.countDocuments(scope),
    Plant.countDocuments(scope),
  ]);

  return {
    machines,
    plants,
    users,
  };
};

export const getActiveSubscription = ({ organizationId = "", tenantId = "" }) =>
  Subscription.findOne({
    ...(tenantId ? { tenantId } : {}),
    ...(organizationId ? { organizationId } : {}),
    status: { $in: ["trialing", "active", "past_due"] },
  })
    .sort({ createdAt: -1 })
    .lean();

export const createInvoiceId = () =>
  `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
    100000 + Math.random() * 900000
  )}`;

export const createSubscriptionInvoice = async ({ plan, subscription }) => {
  const amount = subscription.billingCycle === "annual"
    ? Number(plan.annualPrice || 0)
    : Number(plan.monthlyPrice || 0);

  return Invoice.create({
    amountDue: amount,
    currency: "USD",
    dueDate: subscription.currentPeriodStart,
    invoiceId: createInvoiceId(),
    lines: [
      {
        amount,
        description: `${plan.name} ${subscription.billingCycle} subscription`,
        quantity: 1,
        unitAmount: amount,
      },
    ],
    organizationId: subscription.organizationId,
    status: amount > 0 ? "open" : "paid",
    subscriptionId: String(subscription._id),
    tenantId: subscription.tenantId,
  });
};
