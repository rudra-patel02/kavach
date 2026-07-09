import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));

import AuthGuard from "@/components/AuthGuard";

describe("AuthGuard (DoD: protected pages redirect to /login)", () => {
  beforeEach(() => {
    localStorage.clear();
    replace.mockClear();
  });

  test("with no token it redirects to /login and renders nothing sensitive", () => {
    render(
      <AuthGuard>
        <div>secret content</div>
      </AuthGuard>
    );
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("secret content")).not.toBeInTheDocument();
  });

  test("with a token it renders the protected children", () => {
    localStorage.setItem("token", "a-valid-token");
    render(
      <AuthGuard>
        <div>secret content</div>
      </AuthGuard>
    );
    expect(screen.getByText("secret content")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
