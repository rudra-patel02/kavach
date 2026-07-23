const CACHE_NAME = "kavach-v4-shell";
const SHELL_URLS = ["/", "/dashboard/executive", "/machines", "/iot", "/smart-factory"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() => caches.match(request).then((response) => response || caches.match("/")))
  );
});

self.addEventListener("push", (event) => {
  const payload = event.data?.json?.() || {
    title: "KAVACH Alert",
    body: "A machine requires attention.",
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "KAVACH Alert", {
      body: payload.body || "A machine requires attention.",
      data: payload.data || {},
      icon: "/favicon.ico",
      tag: payload.tag || "kavach-alert",
    })
  );
});
