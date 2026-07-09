const DEV_BACKEND_URL = "http://localhost:5000";
const API_PREFIX = "/api";

import { navigateTo } from "./navigate";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const stripApiPrefix = (value: string) =>
  trimTrailingSlash(value).replace(/\/api$/i, "");

const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

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
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredUrl) {
    return trimTrailingSlash(configuredUrl);
  }

  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;

    if (isLocalHostname(hostname)) {
      return DEV_BACKEND_URL;
    }

    return origin;
  }

  return DEV_BACKEND_URL;
};

export const getSocketBaseUrl = () => {
  const configuredUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (configuredUrl) {
    return stripApiPrefix(configuredUrl);
  }

  const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredApiUrl) {
    return stripApiPrefix(configuredApiUrl);
  }

  return DEV_BACKEND_URL;
};

export const apiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return joinApiBaseAndPath(getApiBaseUrl(), path);
};

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

const refreshAccessToken = async () => {
  if (typeof window === "undefined") {
    return null;
  }

  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
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

  return payload.token || null;
};

// Clear the session and hard-redirect to /login. Called when a request is
// unrecoverably unauthorized (a 401 that a token refresh could not resolve), so
// a protected page never sits on stale, unusable data.
export const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("kavach:auth-changed"));
  if (window.location.pathname !== "/login") {
    navigateTo("/login");
  }
};

export interface FetchJsonInit extends RequestInit {
  // Auth calls (login/refresh) opt out of the redirect: a 401 there means bad
  // credentials, not an expired session.
  skipAuthRedirect?: boolean;
}

export const fetchJson = async <T>(path: string, init: FetchJsonInit = {}) => {
  const { skipAuthRedirect, ...requestInit } = init;
  const method = String(requestInit.method || "GET").toUpperCase();
  const canRetry = method === "GET";
  const makeRequest = (token: string | null) =>
    fetch(apiUrl(path), {
      cache: "no-store",
      ...requestInit,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(requestInit.headers || {}),
      },
    });

  let response: Response;

  try {
    response = await makeRequest(getToken());
  } catch (error) {
    if (!canRetry) {
      throw error;
    }

    await new Promise((resolve) => globalThis.setTimeout(resolve, 300));
    response = await makeRequest(getToken());
  }

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      response = await makeRequest(refreshedToken);
    }

    // Still unauthorized after a refresh attempt → the session is dead.
    if (response.status === 401 && !skipAuthRedirect) {
      redirectToLogin();
    }
  }

  if (canRetry && response.status >= 500) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 300));
    response = await makeRequest(getToken());
  }

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
