import { NextRequest } from "next/server";

const BACKEND_ORIGIN =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://kavach-spgh.onrender.com";

const trimTrailingSlash = (value: string) => value.trim().replace(/\/+$/, "");
const backendBaseUrl = trimTrailingSlash(BACKEND_ORIGIN).replace(/\/api$/i, "");

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "origin",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const buildBackendUrl = (request: NextRequest, pathParts: string[] = []) => {
  const path = pathParts.map(encodeURIComponent).join("/");
  const url = new URL(request.url);
  const query = url.search || "";

  return `${backendBaseUrl}/api/${path}${query}`;
};

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (!hopByHopHeaders.has(normalizedKey)) {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildResponseHeaders = (backendHeaders: Headers) => {
  const headers = new Headers();

  backendHeaders.forEach((value, key) => {
    const normalizedKey = key.toLowerCase();

    if (!hopByHopHeaders.has(normalizedKey)) {
      headers.set(key, value);
    }
  });

  headers.set("Cache-Control", "no-store");
  return headers;
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) => {
  const { path = [] } = await context.params;
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const response = await fetch(buildBackendUrl(request, path), {
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    headers: buildForwardHeaders(request),
    method,
    redirect: "manual",
  });

  return new Response(response.body, {
    headers: buildResponseHeaders(response.headers),
    status: response.status,
    statusText: response.statusText,
  });
};

export const dynamic = "force-dynamic";

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
