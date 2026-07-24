import { clearStoredAuth, notifyAuthChanged } from "./auth";

const API_PREFIX = "/api";
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_DELAYS_MS = [500, 1500, 3000];

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const enforceHttps = (value: string) => {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);

    if (url.protocol === "http:" && process.env.NODE_ENV === "production") {
      url.protocol = "https:";
    }

    if (url.protocol === "ws:" && process.env.NODE_ENV === "production") {
      url.protocol = "wss:";
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(trimmed);
  }
};
const stripApiPrefix = (value: string) =>
  enforceHttps(value).replace(/\/api$/i, "");

const normalizePath = (path: string) => (path.startsWith("/") ? path : `/${path}`);

const joinApiBaseAndPath = (baseUrl: string, path: string) => {
  const normalizedBaseUrl = trimTrailingSlash(baseUrl);
  const normalizedPath = normalizePath(path);

  if (!normalizedBaseUrl) {
    return normalizedPath;
  }

  if (
    normalizedBaseUrl.endsWith(API_PREFIX) &&
    (normalizedPath === API_PREFIX || normalizedPath.startsWith(`${API_PREFIX}/`))
  ) {
    return `${normalizedBaseUrl}${normalizedPath.slice(API_PREFIX.length)}`;
  }

  return `${normalizedBaseUrl}${normalizedPath}`;
};

export const getApiBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "";

  return stripApiPrefix(configuredUrl);
};

export const getSocketBaseUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "";

  return stripApiPrefix(configuredUrl);
};

export const apiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return enforceHttps(path);
  }

  return joinApiBaseAndPath(getApiBaseUrl(), path);
};

const getToken = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token") || getAuthCookie("kavach_access_token")
    : null;

const getAuthCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
};

const delay = (ms: number) =>
  new Promise((resolve) => globalThis.setTimeout(resolve, ms));

const isRetryableStatus = (status: number) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

const isRetryableMethod = (method: string) =>
  ["GET", "HEAD", "OPTIONS", "POST"].includes(method);

const mergeAbortSignals = (
  signal: AbortSignal | null | undefined,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  const abort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", abort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abort);
    },
  };
};

export const apiFetch = async (
  path: string,
  init: RequestInit = {},
  options: { retryDelaysMs?: number[]; timeoutMs?: number } = {}
) => {
  const method = String(init.method || "GET").toUpperCase();
  const retryDelaysMs = isRetryableMethod(method)
    ? options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS
    : [];
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    const { signal, cleanup } = mergeAbortSignals(init.signal, timeoutMs);

    try {
      const response = await fetch(apiUrl(path), {
        cache: "no-store",
        ...init,
        signal,
      });

      cleanup();

      if (
        attempt < retryDelaysMs.length &&
        isRetryableStatus(response.status)
      ) {
        await delay(retryDelaysMs[attempt]);
        continue;
      }

      return response;
    } catch (error) {
      cleanup();
      lastError = error;

      if (attempt >= retryDelaysMs.length) {
        break;
      }

      await delay(retryDelaysMs[attempt]);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to connect to server");
};

const refreshAccessToken = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return null;
  }

  const response = await apiFetch("/api/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearStoredAuth();
    return null;
  }

  const payload = (await response.json()) as {
    token?: string;
    refreshToken?: string;
    user?: unknown;
  };

  if (payload.token) {
    localStorage.setItem("token", payload.token);
  }

  if (payload.refreshToken) {
    localStorage.setItem("refreshToken", payload.refreshToken);
  }

  if (payload.user) {
    localStorage.setItem("user", JSON.stringify(payload.user));
  }

  notifyAuthChanged();

  return payload.token || null;
};

export const authenticatedFetch = async (
  path: string,
  init: RequestInit = {}
) => {
  const makeRequest = (token: string | null) =>
    apiFetch(path, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

  let response: Response;

  try {
    response = await makeRequest(getToken());
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Unable to connect to server");
  }

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await makeRequest(refreshedToken);
    }
  }

  return response;
};

export const fetchJson = async <T>(path: string, init: RequestInit = {}) => {
  const response = await authenticatedFetch(path, init);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload as T;
};
