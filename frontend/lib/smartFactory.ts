import { fetchJson } from "./api";
import type { MachineData } from "@/types/machine";

export interface ProtocolIntegration {
  protocol: string;
  displayName: string;
  devices: number;
  online: number;
  offline: number;
  warning: number;
  recentErrors: number;
  availability: number;
  status: "healthy" | "watch" | "degraded";
}

export interface SmartFactoryTwinNode {
  id: string;
  label: string;
  type: "machine" | "device";
  parentMachineId?: string;
  position: { x: number; y: number; z: number };
  state: Record<string, unknown>;
  telemetry?: Record<string, number>;
  devices?: string[];
}

export interface SmartFactoryTwin {
  generatedAt: string;
  version: string;
  nodes: SmartFactoryTwinNode[];
  summary: {
    machines: number;
    devices: number;
    onlineDevices: number;
    averageHealth: number;
    highRiskMachines: number;
  };
  alerts: {
    id: string;
    machineId?: string;
    severity: string;
    title: string;
    createdAt: string | null;
  }[];
  vision: {
    summary: {
      totalEvents: number;
      openEvents: number;
      criticalEvents: number;
      monitoredUseCases: string[];
    };
    byType: Record<string, number>;
  };
}

export interface SmartFactoryTwinResponse {
  success: boolean;
  twin: SmartFactoryTwin;
}

export interface AIVisionEventPayload {
  cameraId: string;
  eventType: "PPE" | "FIRE" | "SMOKE" | "INTRUSION";
  machineId?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  detections?: {
    label: string;
    confidence: number;
    severity?: "Low" | "Medium" | "High" | "Critical";
  }[];
  snapshotUrl?: string;
}

export interface ProtocolIntegrationsResponse {
  success: boolean;
  integrations: {
    generatedAt: string;
    protocols: ProtocolIntegration[];
    summary: {
      adaptersReady: number;
      connectedDevices: number;
      degradedProtocols: number;
      enterpriseReadiness: number;
    };
  };
}

export interface MachineLookupResponse {
  success: boolean;
  machine: MachineData;
}

export const fetchSmartFactoryTwin = () =>
  fetchJson<SmartFactoryTwinResponse>("/api/smart-factory/twin");

export const fetchProtocolIntegrations = () =>
  fetchJson<ProtocolIntegrationsResponse>("/api/smart-factory/integrations");

export const lookupMachineByQr = (code: string) =>
  fetchJson<MachineLookupResponse>(
    `/api/machines/lookup/${encodeURIComponent(code)}`
  );

export const createAIVisionEvent = (payload: AIVisionEventPayload) =>
  fetchJson<{ success: boolean; event: unknown }>("/api/smart-factory/vision/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
