const isValidSubscription = (subscription = {}) =>
  Boolean(
    subscription.endpoint &&
      subscription.keys &&
      subscription.keys.auth &&
      subscription.keys.p256dh
  );

export const normalizePushSubscription = (payload = {}, context = {}) => {
  const subscription = payload.subscription || payload;

  if (!isValidSubscription(subscription)) {
    const error = new Error("Valid push subscription endpoint and keys are required");
    error.statusCode = 400;
    throw error;
  }

  return {
    endpoint: String(subscription.endpoint).trim(),
    keys: {
      auth: String(subscription.keys.auth),
      p256dh: String(subscription.keys.p256dh),
    },
    metadata: {
      expirationTime: subscription.expirationTime || null,
      source: payload.source || "pwa",
    },
    organizationId: context.organizationId || "",
    plantId: context.plantId || "",
    tenantId: context.tenantId || "",
    userAgent: context.userAgent || "",
    userId: context.userId || "",
  };
};

export const buildPushPayload = (notification = {}) => ({
  body:
    notification.message ||
    notification.description ||
    "A Kavach alert requires attention.",
  data: {
    machineId: notification.machineId || "",
    notificationId: String(notification._id || notification.id || ""),
    severity: notification.severity || "Medium",
    url: notification.machineId
      ? `/machines/${encodeURIComponent(notification.machineId)}`
      : "/alerts",
  },
  tag: String(notification._id || notification.id || `kavach-${Date.now()}`),
  title: notification.title || "KAVACH Alert",
});

export const summarizePushDelivery = (subscriptions = [], payload = {}) => ({
  attempted: subscriptions.length,
  payload,
  skipped: subscriptions.filter((subscription) => subscription.status !== "active").length,
  targetEndpoints: subscriptions
    .filter((subscription) => subscription.status === "active")
    .map((subscription) => subscription.endpoint),
});
