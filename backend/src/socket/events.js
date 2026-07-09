// The canonical live-update event names shared (by contract) with the frontend
// client. Kept minimal and in-scope for Parts 1–4: plant/machine KPI changes,
// new alerts, and work-order lifecycle changes.
export const SOCKET_EVENTS = {
  CONNECTED: "connected",
  KPI_UPDATE: "kpi:update",
  MACHINE_UPDATE: "machine:update",
  ALERT_CREATED: "alert:created",
  WORKORDER_UPDATE: "workorder:update",
};
