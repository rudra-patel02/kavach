import { fetchJson } from "./api";
import type {
  WorkOrderDeleteResponse,
  WorkOrderResponse,
  WorkOrdersResponse,
  WorkOrderUpdatePayload,
} from "@/types/workOrder";

export const fetchWorkOrders = () =>
  fetchJson<WorkOrdersResponse>("/api/workorders");

export const fetchWorkOrder = (id: string) =>
  fetchJson<WorkOrderResponse>(`/api/workorders/${encodeURIComponent(id)}`);

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

export const deleteWorkOrder = (id: string) =>
  fetchJson<WorkOrderDeleteResponse>(
    `/api/workorders/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
