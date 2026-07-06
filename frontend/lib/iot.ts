import { fetchJson } from "./api";
import type { IoTDevicesResponse, IoTOverviewResponse } from "@/types/iot";

export const fetchIoTOverview = () =>
  fetchJson<IoTOverviewResponse>("/api/iot");

export const fetchIoTDevices = () =>
  fetchJson<IoTDevicesResponse>("/api/iot/devices");
