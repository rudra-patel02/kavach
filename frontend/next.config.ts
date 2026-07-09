import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
const DEV_BACKEND_URL = "http://localhost:5000";

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");
const stripApiPrefix = (value: string) =>
  trimTrailingSlash(value).replace(/\/api$/i, "");

const backendUrl = stripApiPrefix(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEV_BACKEND_URL
);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingRoot: frontendRoot,
  turbopack: {
    root: frontendRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
