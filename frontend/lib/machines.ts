import { fetchJson } from "./api";
import type { MachineData } from "@/types/machine";

export const fetchMachines = () => fetchJson<MachineData[]>("/api/machines");

export const fetchMachine = (id: string) =>
  fetchJson<MachineData>(`/api/machines/${encodeURIComponent(id)}`);

export const createMachine = (payload: {
  department: string;
  machineId: string;
  name: string;
  status: string;
}) =>
  fetchJson<MachineData>("/api/machines", {
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });
