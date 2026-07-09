import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { parseCorsOrigins } from "../config/environment.js";
import { SOCKET_EVENTS } from "./events.js";

// Module-level handle so services/controllers can push events without threading
// the io instance through every call. Null until the server is initialized —
// which is the case in tests that import app.js without a real HTTP server, so
// emitEvent() is a safe no-op there.
let io = null;

const extractToken = (handshake = {}) => {
  const authToken = handshake.auth?.token;
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }
  const header = handshake.headers?.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

// Verify a Socket.IO handshake the same way the REST authMiddleware verifies a
// request: a valid HS256 JWT is required. Returns the decoded user, or throws.
// Exported so the security property is directly unit-testable.
export const authenticateHandshake = (handshake = {}) => {
  const token = extractToken(handshake);
  if (!token) {
    throw new Error("Unauthorized");
  }
  return jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
};

// Authenticated Socket.IO server. The handshake MUST carry a valid HS256 JWT
// (via `auth.token` or an Authorization header); a tokenless or tampered
// connection is refused before any event can flow — the socket is not a
// backdoor around the REST auth.
export const initSocket = (httpServer) => {
  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: allowedOrigins === "*" ? true : allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      socket.data.user = authenticateHandshake(socket.handshake);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.CONNECTED, { ok: true });
  });

  return io;
};

export const getIO = () => io;

// Safe emit for services/controllers. No-op until initSocket() has run.
export const emitEvent = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};

export const closeSocket = () =>
  new Promise((resolve) => {
    if (!io) {
      resolve();
      return;
    }
    io.close(() => {
      io = null;
      resolve();
    });
  });
