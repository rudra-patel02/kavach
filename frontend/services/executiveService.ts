import { fetchJson } from "@/lib/api";
import type { ExecutiveDashboardResponse } from "@/types/executive";

interface ExecutiveDashboardRequestOptions {
  retries?: number;
  signal?: AbortSignal;
}

const wait = (durationMs: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });

export const getExecutiveDashboard = async ({
  retries = 1,
  signal,
}: ExecutiveDashboardRequestOptions = {}) => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJson<ExecutiveDashboardResponse>(
        "/api/executive/dashboard",
        { signal }
      );
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      lastError = error;

      if (attempt < retries) {
        await wait(450 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Executive dashboard unavailable");
};
