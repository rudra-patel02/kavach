import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import type { KpiResponse } from "@/types";

// Capture the socket handlers so the test can fire a live event.
const { socketRegistry, fireSocket } = vi.hoisted(() => {
  const reg: Record<string, (p: unknown) => void> = {};
  return { socketRegistry: reg, fireSocket: (event: string) => reg[event]?.(undefined) };
});

vi.mock("@/lib/socket", () => ({
  SOCKET_EVENTS: {
    CONNECTED: "connected",
    KPI_UPDATE: "kpi:update",
    MACHINE_UPDATE: "machine:update",
    ALERT_CREATED: "alert:created",
    WORKORDER_UPDATE: "workorder:update",
  },
  useSocketEvent: (event: string, handler: (p: unknown) => void) => {
    socketRegistry[event] = handler;
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/data", () => ({ getKpis: vi.fn() }));

import { getKpis } from "@/lib/data";
import DashboardView from "@/components/DashboardView";

const kpiResponse = (oee: number): KpiResponse => ({
  success: true,
  window: { from: "2026-07-01T00:00:00.000Z", to: "2026-07-02T00:00:00.000Z" },
  plant: {
    machineCount: 1,
    availability: 0.9,
    performance: 0.8,
    quality: 0.8,
    oee,
    dataComplete: true,
    mtbfHours: 6,
    mttrHours: 2,
    failures: 1,
  },
  machines: [
    {
      machineId: "M-001",
      name: "Press",
      status: "Running",
      availability: 0.9,
      performance: 0.8,
      quality: 0.8,
      oee,
      dataComplete: true,
      mtbfHours: 6,
      mttrHours: 2,
      failures: 1,
    },
  ],
});

describe("DashboardView (DoD: renders API KPIs, updates on a socket event)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("renders KPIs from the mocked API and refreshes on kpi:update", async () => {
    (getKpis as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(kpiResponse(0.5))
      .mockResolvedValueOnce(kpiResponse(0.75));

    render(<DashboardView />);

    // Initial OEE from the API.
    await waitFor(() => expect(screen.getAllByText("50.0%").length).toBeGreaterThan(0));

    // A live KPI event makes the dashboard refetch and show the new value.
    await act(async () => {
      fireSocket("kpi:update");
    });
    await waitFor(() => expect(screen.getAllByText("75.0%").length).toBeGreaterThan(0));

    expect(getKpis).toHaveBeenCalledTimes(2);
  });
});
