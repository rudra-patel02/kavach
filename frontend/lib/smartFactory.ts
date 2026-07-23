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
