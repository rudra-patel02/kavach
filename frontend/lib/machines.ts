import { fetchJson } from "./api";
import type { MachineData } from "@/types/machine";

export const fetchMachines = () => fetchJson<MachineData[]>("/api/machines");

export const fetchMachine = (id: string) =>
  fetchJson<MachineData>(`/api/machines/${encodeURIComponent(id)}`);
