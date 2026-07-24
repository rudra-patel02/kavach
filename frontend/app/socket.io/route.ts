import { NextRequest } from "next/server";

const BACKEND_ORIGIN =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://kavach-spgh.onrender.com";

const backendBaseUrl = BACKEND_ORIGIN.trim().replace(/\/+$/, "").replace(/\/api$/i, "");

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

const buildForwardHeaders = (request: NextRequest) => {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
};

const buildResponseHeaders = (backendHeaders: Headers) => {
  const headers = new Headers();

  backendHeaders.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("Cache-Control", "no-store");
  return headers;
};

const proxySocketIoPolling = async (request: NextRequest) => {
  const sourceUrl = new URL(request.url);
  const backendUrl = `${backendBaseUrl}/socket.io/${sourceUrl.search}`;
  const method = request.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const response = await fetch(backendUrl, {
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

export const GET = proxySocketIoPolling;
export const POST = proxySocketIoPolling;
