import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/workorders",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/socket", () => ({
  SOCKET_EVENTS: {
    CONNECTED: "connected",
    KPI_UPDATE: "kpi:update",
    MACHINE_UPDATE: "machine:update",
    ALERT_CREATED: "alert:created",
    WORKORDER_UPDATE: "workorder:update",
  },
  useSocketEvent: () => {},
}));

vi.mock("@/lib/data", () => ({
  getWorkOrders: vi.fn().mockResolvedValue([
    {
      id: "wo-1",
      machineId: "M-001",
      title: "Fix motor",
      priority: "High",
      status: "Assigned",
      updatedAt: "2026-07-09T00:00:00.000Z",
    },
  ]),
  getMachines: vi.fn().mockResolvedValue([{ machineId: "M-001", name: "Press" }]),
  getUsers: vi.fn().mockResolvedValue({ users: [], roles: [] }),
  updateWorkOrder: vi.fn(),
}));

import WorkOrdersView from "@/components/WorkOrdersView";

describe("WorkOrdersView role gating (DoD: Viewer sees no mutation controls)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("a Viewer sees the list but no create picker and no advance button", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "Viewer" }));
    render(<WorkOrdersView />);

    await waitFor(() => expect(screen.getByText("Fix motor")).toBeInTheDocument());
    expect(screen.queryByLabelText("Machine")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark in progress/i })).not.toBeInTheDocument();
  });

  test("a Manager sees the create picker and the advance control", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "Manager" }));
    render(<WorkOrdersView />);

    await waitFor(() => expect(screen.getByLabelText("Machine")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /mark in progress/i })).toBeInTheDocument();
  });

  test("an Engineer can advance (sees the advance control) but not the create picker", async () => {
    localStorage.setItem("user", JSON.stringify({ role: "Engineer" }));
    render(<WorkOrdersView />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /mark in progress/i })).toBeInTheDocument()
    );
    expect(screen.queryByLabelText("Machine")).not.toBeInTheDocument();
  });
});
