const DEV_BACKEND_URL = "http://localhost:5000";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

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
  return configuredUrl ? trimTrailingSlash(configuredUrl) : getApiBaseUrl();
};

export const apiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
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
