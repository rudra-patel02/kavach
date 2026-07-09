"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";

import { getSocketBaseUrl } from "./api";

// Canonical live-update events — must match backend src/socket/events.js.
export const SOCKET_EVENTS = {
  CONNECTED: "connected",
  KPI_UPDATE: "kpi:update",
  MACHINE_UPDATE: "machine:update",
  ALERT_CREATED: "alert:created",
  WORKORDER_UPDATE: "workorder:update",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

let socket: Socket | null = null;

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("token") : null;

// Lazily create the shared socket. The JWT rides in the handshake `auth.token`;
// without a token there is no connection (the server would refuse it anyway).
export const getSocket = (): Socket | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const token = getToken();
  if (!token) {
    return null;
  }
  if (!socket) {
    socket = io(getSocketBaseUrl(), {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: { token },
      autoConnect: true,
      reconnection: true,
    });
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Subscribe a component to a live event for its lifetime. Wrap the handler in
// useCallback so it doesn't resubscribe every render.
export const useSocketEvent = (
  event: SocketEvent,
  handler: (payload: unknown) => void
) => {
  useEffect(() => {
    const active = getSocket();
    if (!active) {
      return;
    }
    active.on(event, handler);
    return () => {
      active.off(event, handler);
    };
  }, [event, handler]);
};
