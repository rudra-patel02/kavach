export type IoTDeviceStatus = "online" | "offline" | "unknown";

export interface IoTDevice {
  id: string;
  deviceId: string;
  machineId: string;
  deviceType: string;
  protocol: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  connectionStatus: IoTDeviceStatus;
  lastSeen: string | null;
  lastHeartbeat: string | null;
  batteryLevel: number | null;
  signalStrength: number | null;
  healthStatus: string;
  telemetryRate: number;
  supportedSensors: string[];
  metadata: Record<string, unknown>;
  statusTimeline: {
    at: string;
    message: string;
    status: string;
  }[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface IoTTelemetry {
  id: string;
  deviceId: string;
  machineId: string;
  metrics: Record<string, number>;
  source: string;
  timestamp: string | null;
  createdAt: string | null;
}

export interface IoTStatusTimelineItem {
  at: string | null;
  deviceId: string;
  event: string;
  machineId: string;
  message: string;
  status: string;
}

export interface IoTSupportedDevice {
  deviceType: string;
  protocols: string[];
  sensors: string[];
}

export interface IoTOverview {
  devices: IoTDevice[];
  firmwareExamples: Record<string, string>;
  latestTelemetry: IoTTelemetry[];
  protocolAdapters: IoTSupportedDevice[];
  status: {
    offlineDevices: number;
    onlineDevices: number;
    totalDevices: number;
  };
  statusTimeline: IoTStatusTimelineItem[];
}

export interface IoTOverviewResponse {
  success: boolean;
  overview: IoTOverview;
}

export interface IoTDevicesResponse {
  success: boolean;
  devices: IoTDevice[];
}
