import AppShell from "@/components/AppShell";
import MachineDetailView from "@/components/MachineDetailView";

// Next 16: route params are async and must be awaited.
export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell>
      <MachineDetailView machineId={id} />
    </AppShell>
  );
}
