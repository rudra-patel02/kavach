const DEV_BACKEND_URL = "http://localhost:5000";
const API_PREFIX = "/api";

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

export const fetchJson = async <T>(path: string, init: RequestInit = {}) => {
  const response = await fetch(apiUrl(path), {
    cache: "no-store",
    ...init,
  });

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
