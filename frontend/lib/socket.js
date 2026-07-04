import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket", "polling"],
});

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