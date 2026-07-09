import { redirect } from "next/navigation";

// The machine health list lives on the dashboard; the per-machine drill-down is
// /machines/[id]. The bare /machines index just points back to the dashboard.
export default function MachinesIndexPage() {
  redirect("/");
}
