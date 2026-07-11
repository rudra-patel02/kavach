import { apiUrl, authenticatedFetch, fetchJson } from "./api";
import type {
  WorkOrderDeleteResponse,
  WorkOrderResponse,
  WorkOrderStatsResponse,
  WorkOrdersResponse,
  WorkOrderUpdatePayload,
} from "@/types/workOrder";

export const fetchWorkOrders = () =>
  fetchJson<WorkOrdersResponse>("/api/workorders");

export const fetchWorkOrder = (id: string) =>
  fetchJson<WorkOrderResponse>(`/api/workorders/${encodeURIComponent(id)}`);

export const fetchWorkOrderStats = () =>
  fetchJson<WorkOrderStatsResponse>("/api/workorders/stats");

export const createWorkOrder = (payload: WorkOrderUpdatePayload & { machineId: string }) =>
  fetchJson<WorkOrderResponse>("/api/workorders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updateWorkOrder = (id: string, payload: WorkOrderUpdatePayload) =>
  fetchJson<WorkOrderResponse>(`/api/workorders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const replaceWorkOrder = (id: string, payload: WorkOrderUpdatePayload) =>
  fetchJson<WorkOrderResponse>(`/api/workorders/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updateWorkOrderStatus = (
  id: string,
  payload: Pick<WorkOrderUpdatePayload, "author" | "note" | "status">
) =>
  fetchJson<WorkOrderResponse>(
    `/api/workorders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

export const assignWorkOrder = (
  id: string,
  payload: Pick<WorkOrderUpdatePayload, "assignedEngineer" | "author" | "note">
) =>
  fetchJson<WorkOrderResponse>(
    `/api/workorders/${encodeURIComponent(id)}/assign`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

export const completeWorkOrder = (
  id: string,
  payload: Pick<
    WorkOrderUpdatePayload,
    | "actualCost"
    | "actualHours"
    | "author"
    | "checklist"
    | "completedDate"
    | "completionNotes"
    | "maintenanceChecklist"
    | "note"
  > = {}
) =>
  fetchJson<WorkOrderResponse>(
    `/api/workorders/${encodeURIComponent(id)}/complete`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

export const getWorkOrderExportUrl = (format: "csv" | "excel" | "pdf") =>
  apiUrl(`/api/workorders/export/${format}`);

export const getWorkOrderPrintUrl = (id: string) =>
  apiUrl(`/api/workorders/${encodeURIComponent(id)}/print`);

const downloadBlob = async (url: string, filename: string) => {
  const response = await authenticatedFetch(url);

  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const downloadWorkOrderExport = (format: "csv" | "excel" | "pdf") =>
  downloadBlob(
    getWorkOrderExportUrl(format),
    `kavach-work-orders-${Date.now()}.${format === "pdf" ? "pdf" : "csv"}`
  );

export const printWorkOrder = async (id: string) => {
  const response = await authenticatedFetch(getWorkOrderPrintUrl(id));

  if (!response.ok) {
    throw new Error(`Print view failed with status ${response.status}`);
  }

  const html = await response.text();
  const printWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!printWindow) {
    throw new Error("Browser blocked the print window");
  }

  printWindow.document.write(html);
  printWindow.document.close();
};

export const deleteWorkOrder = (id: string) =>
  fetchJson<WorkOrderDeleteResponse>(
    `/api/workorders/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
