import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import http from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import { startSensorSimulation } from "./services/SensorService.js";

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
//app.use("/api/machines", machineRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Backend Running",
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
//startSensorSimulation(io);

io.on("connection", (socket) => {
  console.log("🟢 Socket Connected:", socket.id);

  socket.emit("hello", {
    message: "Socket Working",
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket Disconnected");
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});