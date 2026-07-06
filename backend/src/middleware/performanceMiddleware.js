import zlib from "node:zlib";

const defaultCompressiblePattern =
  /json|text|javascript|typescript|css|svg|xml|yaml|csv/i;

const appendVary = (res, value) => {
  const current = res.getHeader("Vary");

  if (!current) {
    res.setHeader("Vary", value);
    return;
  }

  const values = String(current)
    .split(",")
    .map((item) => item.trim().toLowerCase());

  if (!values.includes(value.toLowerCase())) {
    res.setHeader("Vary", `${current}, ${value}`);
  }
};

const chooseEncoding = (acceptEncoding = "") => {
  const normalized = String(acceptEncoding).toLowerCase();

  if (normalized.includes("br")) {
    return "br";
  }

  if (normalized.includes("gzip")) {
    return "gzip";
  }

  if (normalized.includes("deflate")) {
    return "deflate";
  }

  return "";
};

const compress = (body, encoding) => {
  if (encoding === "br") {
    return zlib.brotliCompressSync(body);
  }

  if (encoding === "gzip") {
    return zlib.gzipSync(body);
  }

  return zlib.deflateSync(body);
};

export const compression = ({
  thresholdBytes = Number(process.env.COMPRESSION_THRESHOLD_BYTES || 1024),
  typePattern = defaultCompressiblePattern,
} = {}) => {
  return (req, res, next) => {
    if (req.method === "HEAD") {
      return next();
    }

    const encoding = chooseEncoding(req.headers["accept-encoding"]);

    if (!encoding) {
      return next();
    }

    const chunks = [];
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = (chunk, encodingOrCallback, callback) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      if (typeof encodingOrCallback === "function") {
        encodingOrCallback();
      } else if (typeof callback === "function") {
        callback();
      }

      return true;
    };

    res.end = (chunk, encodingOrCallback, callback) => {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      const body = Buffer.concat(chunks);
      const contentType = String(res.getHeader("Content-Type") || "");
      const shouldSkip =
        res.statusCode < 200 ||
        res.statusCode === 204 ||
        res.statusCode === 304 ||
        Boolean(res.getHeader("Content-Encoding")) ||
        String(res.getHeader("Cache-Control") || "").includes("no-transform") ||
        body.length < thresholdBytes ||
        !typePattern.test(contentType);

      res.write = originalWrite;
      res.end = originalEnd;

      if (shouldSkip) {
        return originalEnd(body, encodingOrCallback, callback);
      }

      try {
        const compressed = compress(body, encoding);
        appendVary(res, "Accept-Encoding");
        res.setHeader("Content-Encoding", encoding);
        res.removeHeader("Content-Length");
        return originalEnd(compressed, encodingOrCallback, callback);
      } catch (error) {
        console.error("Response compression failed:", error.message);
        return originalEnd(body, encodingOrCallback, callback);
      }
    };

    next();
  };
};

export const cacheControl =
  ({ maxAgeSeconds = 60, scope = "private", staleWhileRevalidateSeconds = 30 } = {}) =>
  (req, res, next) => {
    if (req.method === "GET" || req.method === "HEAD") {
      res.setHeader(
        "Cache-Control",
        `${scope}, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
      );
    }

    next();
  };

export const memoryCache = ({ ttlMs = 30000, maxEntries = 100 } = {}) => {
  const cache = new Map();

  return (req, res, next) => {
    if (req.method !== "GET" || req.headers.authorization) {
      return next();
    }

    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && cached.expiresAt > Date.now()) {
      for (const [header, value] of Object.entries(cached.headers)) {
        res.setHeader(header, value);
      }

      res.setHeader("X-Cache", "HIT");
      return res.status(cached.statusCode).send(Buffer.from(cached.body));
    }

    const originalSend = res.send.bind(res);

    res.send = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (cache.size >= maxEntries) {
          cache.delete(cache.keys().next().value);
        }

        cache.set(key, {
          body: Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? "")),
          expiresAt: Date.now() + ttlMs,
          headers: {
            "Content-Type": res.getHeader("Content-Type") || "application/json",
          },
          statusCode: res.statusCode,
        });
      }

      res.setHeader("X-Cache", "MISS");
      return originalSend(body);
    };

    next();
  };
};
