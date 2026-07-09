import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/data", () => ({
  createWorkOrder: vi.fn().mockResolvedValue({ id: "wo-1", status: "Open" }),
}));

import { createWorkOrder } from "@/lib/data";
import WorkOrderForm from "@/components/WorkOrderForm";

describe("WorkOrderForm (DoD: create work order posts via the api layer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("submitting posts through createWorkOrder with the machine + title (not a raw fetch)", async () => {
    render(<WorkOrderForm machineId="M-001" linkedAlertId="alert-9" />);

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Investigate over-temperature" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create work order/i }));

    await waitFor(() =>
      expect(createWorkOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          machineId: "M-001",
          title: "Investigate over-temperature",
          linkedAlertId: "alert-9",
        })
      )
    );
  });

  test("an empty title is rejected client-side and does not post", async () => {
    render(<WorkOrderForm machineId="M-001" />);
    fireEvent.click(screen.getByRole("button", { name: /create work order/i }));
    await screen.findByText(/title is required/i);
    expect(createWorkOrder).not.toHaveBeenCalled();
  });
});
