import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/navigate", () => ({ navigateTo: vi.fn() }));

import { fetchJson, redirectToLogin } from "@/lib/api";
import { navigateTo } from "@/lib/navigate";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("api client (DoD: attaches token, redirects on unrecoverable 401)", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("attaches the bearer token to a request", async () => {
    localStorage.setItem("token", "tok-123");
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchJson("/api/kpis");

    const init = fetchMock.mock.calls[0][1];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok-123");
  });

  test("on a 401 it attempts a refresh, then (failing) clears the session and redirects", async () => {
    localStorage.setItem("token", "stale");
    // No refreshToken stored → the refresh call returns 401 → unrecoverable.
    const fetchMock = vi.fn().mockResolvedValue(new Response("no", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("/api/kpis")).rejects.toThrow();

    expect(navigateTo).toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("redirectToLogin clears tokens and navigates to /login", () => {
    localStorage.setItem("token", "t");
    localStorage.setItem("refreshToken", "r");

    redirectToLogin();

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(navigateTo).toHaveBeenCalledWith("/login");
  });
});
