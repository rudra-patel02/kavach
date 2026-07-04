import { io } from "socket.io-client";
import { getSocketBaseUrl } from "./api";

const socket = io(getSocketBaseUrl(), {
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000,
});

if (typeof window !== "undefined") {
  socket.connect();
}

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("hello", (data) => {
  console.log(data);
});

socket.on("connect_error", (err) => {
  console.error(err);
});

export default socket;
