import http from "node:http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import { authRouter } from "./api/auth";
import { reportsRouter, setReportsSocketEmitter } from "./api/reports";
import { ticketsRouter, setTicketsSocketEmitter } from "./api/tickets";
import { zonesRouter, setZonesSocketEmitter } from "./api/zones";
import { statsRouter } from "./api/stats";
import { infographicsRouter } from "./api/infographics";

const app = express();
const server = http.createServer(app);

// Cấu hình CORS mở cho các ứng dụng frontend (admin dashboard & student app)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "5mb" }));

// Cấu hình Socket.IO phục vụ realtime cho dashboard ca trực và ứng dụng sinh viên
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  // console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Hàm phát sự kiện socket tập trung
function broadcastSocketEvent(event: string, data: any) {
  io.emit(event, data);
}

setReportsSocketEmitter(broadcastSocketEvent);
setTicketsSocketEmitter(broadcastSocketEvent);
setZonesSocketEmitter(broadcastSocketEvent);

// Đăng ký các router API
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/infographics", infographicsRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sfz-backend",
    version: "0.2.0-d2",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js"));

if (isMainModule) {
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`=======================================================`);
    console.log(` [SFZ Backend API - VNU SmarT-Free Zone] Running`);
    console.log(` Port:    http://127.0.0.1:${PORT}`);
    console.log(` Health:  http://127.0.0.1:${PORT}/api/health`);
    console.log(` Zones:   http://127.0.0.1:${PORT}/api/zones`);
    console.log(` Tickets: http://127.0.0.1:${PORT}/api/tickets`);
    console.log(` Reports: POST http://127.0.0.1:${PORT}/api/reports`);
    console.log(` Auth:    POST http://127.0.0.1:${PORT}/api/auth/login`);
    console.log(`=======================================================`);
  });
}

export { app, server, io };
