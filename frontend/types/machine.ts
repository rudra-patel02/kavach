export interface MachineData {
  _id: string;
  machineId: string;
  name: string;
  department: string;
  status: "Running" | "Warning" | "Critical";
  health: number;
  temperature: number;
}