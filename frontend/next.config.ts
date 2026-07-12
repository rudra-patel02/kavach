import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");
const enforceHttps = (value: string) => {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);

    if (url.protocol === "http:") {
      url.protocol = "https:";
    }

    return trimTrailingSlash(url.toString());
  } catch {
    return trimTrailingSlash(trimmed);
  }
};
const stripApiPrefix = (value: string) =>
  enforceHttps(value).replace(/\/api$/i, "");

const publicApiUrl = enforceHttps(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || ""
);
const publicSocketUrl = enforceHttps(
  process.env.NEXT_PUBLIC_SOCKET_URL || publicApiUrl
);
const backendUrl = stripApiPrefix(publicApiUrl);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_SOCKET_URL: publicSocketUrl,
  },
  outputFileTracingRoot: frontendRoot,
  turbopack: {
    root: frontendRoot,
  },
  async rewrites() {
    if (!backendUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
