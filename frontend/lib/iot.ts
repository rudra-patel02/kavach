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

export const fetchLatestIoTSensor = () =>
  fetchJson<IoTLatestSensorResponse>("/api/iot/latest");
