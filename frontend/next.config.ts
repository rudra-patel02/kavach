import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const productionBackendOrigin = "https://kavach-spgh.onrender.com";

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");

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
const publicApiUrl = enforceHttps(process.env.NEXT_PUBLIC_API_URL || "");
const publicSocketUrl = enforceHttps(
  process.env.NEXT_PUBLIC_SOCKET_URL || publicApiUrl || productionBackendOrigin
);

const nextConfig: NextConfig = {
  compress: true,
  env: {
    NEXT_PUBLIC_API_URL: publicApiUrl,
    NEXT_PUBLIC_SOCKET_URL: publicSocketUrl,
  },
  outputFileTracingRoot: frontendRoot,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    root: frontendRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
