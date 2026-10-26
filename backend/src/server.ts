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
import { notifyRouter, setNotifySocketEmitter } from "./notify/webpush";
import { telemetryRouter } from "./api/telemetry";
import { telemetryIngestService } from "./ingest/mqtt";
import { dispatchRouter, setDispatchSocketEmitter } from "./api/dispatch";

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
setNotifySocketEmitter(broadcastSocketEvent);
setDispatchSocketEmitter(broadcastSocketEvent);
telemetryIngestService.setSocketEmitter(broadcastSocketEvent);

import { PrismaClient } from "@prisma/client";
import { sandboxRouter, cleanupExpiredSandboxTickets, setSandboxSocketEmitter } from "./api/sandbox";
import { rollingDatesRouter } from "./api/rolling-dates";

import { docsRouter } from "./api/docs";

export const prisma = new PrismaClient();
setSandboxSocketEmitter(broadcastSocketEvent);

// Thiết lập định kỳ mỗi 5 phút dọn dẹp các phiếu Sandbox cũ hơn 30 phút (unref để không block test process)
const cleanupTimer = setInterval(() => {
  cleanupExpiredSandboxTickets().catch((err) => {
    console.error("[Auto Cleanup Sandbox Error]", err);
  });
}, 5 * 60 * 1000);
cleanupTimer.unref();

// Đăng ký trang tài liệu Swagger UI (OpenAPI 3.0 giống hệt FastAPI)
app.use("/docs", docsRouter);
app.use("/api/docs", docsRouter);

// Đăng ký các router API
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/zones", zonesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/infographics", infographicsRouter);
app.use("/api/notify", notifyRouter);
app.use("/api/telemetry", telemetryRouter);
app.use("/api/sandbox", sandboxRouter);
app.use("/api/admin", rollingDatesRouter);
app.use("/api/dispatch", dispatchRouter);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "sfz-backend",
    version: "1.0.0-final",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Detailed health check phục vụ giám sát vận hành production (UptimeRobot, Health Monitor)
app.get("/api/health/detailed", async (_req, res) => {
  const memUsage = process.memoryUsage();
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = "error";
  }

  res.json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    service: "sfz-backend",
    version: "1.0.0-final",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    database: {
      type: "sqlite",
      status: dbStatus,
    },
    memory: {
      rss_mb: Math.round(memUsage.rss / 1024 / 1024),
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    },
    system: {
      node_version: process.version,
      platform: process.platform,
    },
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
    console.log(` Docs:    http://127.0.0.1:${PORT}/docs (Swagger UI)`);
    console.log(`=======================================================`);
  });
}

export { app, server, io };
