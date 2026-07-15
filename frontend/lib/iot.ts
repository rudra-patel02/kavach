import { fetchJson } from "./api";
import type {
  IoTDevicesResponse,
  IoTLatestSensorResponse,
  IoTOverviewResponse,
} from "@/types/iot";

export const fetchIoTOverview = () =>
  fetchJson<IoTOverviewResponse>("/api/iot");

export const fetchIoTDevices = () =>
  fetchJson<IoTDevicesResponse>("/api/iot/devices");

export const fetchLatestIoTSensor = (deviceId = "esp32-dht22-01") =>
  fetchJson<IoTLatestSensorResponse>(
    `/api/iot/latest?deviceId=${encodeURIComponent(deviceId)}`
  );
