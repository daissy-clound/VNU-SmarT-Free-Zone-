import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { Server } from "socket.io";
import {
  reportSchema,
  statuses,
  type Ticket,
  type User,
} from "../../backend/src/contracts/index";
import { accounts, seedTickets, zones } from "./fixtures";

// Máy chủ tích hợp cục bộ của C. Không thay backend sản xuất của A.
export function createTestServer({
  seed = true,
  sessionMs = 8 * 60 * 60 * 1000,
} = {}) {
  let sequence = 0;
  const tickets = seed ? seedTickets() : [];
  const sessions = new Map<string, { user: User; expires: number }>();
  const attempts = new Map<string, number[]>();
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ]);
  const userFor = (token?: string) => {
    const session = token ? sessions.get(token) : undefined;
    if (!session || session.expires <= Date.now()) {
      if (token) sessions.delete(token);
      return undefined;
    }
    return session.user;
  };
  const json = (res: ServerResponse, status: number, data: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  async function body(req: IncomingMessage) {
    let value = "";
    for await (const chunk of req) {
      value += chunk;
      if (Buffer.byteLength(value) > 16384)
        throw new Error("Payload too large");
    }
    return JSON.parse(value || "{}");
  }
  const http = createServer(async (req, res) => {
    if (req.headers.origin && !allowedOrigins.has(req.headers.origin))
      return json(res, 403, { message: "Origin không được phép." });
    if (req.headers.origin) {
      res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
      res.setHeader("Vary", "Origin");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const url = new URL(req.url || "/", "http://localhost");
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    try {
      if (url.pathname === "/api/health")
        return json(res, 200, {
          mode: "local-integration",
          coordinates_status: "provisional",
        });
      if (req.method === "POST" && url.pathname === "/api/auth/login") {
        const data = await body(req);
        const account = accounts.find(
          (item) => item.username === data.username,
        );
        if (!account || data.password !== "Demo@2026")
          return json(res, 401, {
            message: "Tài khoản hoặc mật khẩu không đúng.",
          });
        const { username: _, ...user } = account;
        const accessToken = randomBytes(32).toString("hex");
        sessions.set(accessToken, { user, expires: Date.now() + sessionMs });
        return json(res, 200, { token: accessToken, user });
      }
      if (req.method === "POST" && url.pathname === "/api/reports") {
        const parsed = reportSchema.safeParse(await body(req));
        if (!parsed.success)
          return json(res, 400, {
            message: "Phản ánh không đúng hợp đồng dữ liệu.",
          });
        const report = parsed.data;
        if (!zones.some((zone) => zone.code === report.zone_code))
          return json(res, 400, { message: "Khu vực không tồn tại." });
        const recent = (attempts.get(report.device_token) || []).filter(
          (time) => Date.now() - time < 600000,
        );
        if (recent.length >= 3)
          return json(res, 429, {
            message: "Tối đa 3 phản ánh trong 10 phút.",
          });
        attempts.set(report.device_token, [...recent, Date.now()]);
        const now = new Date().toISOString();
        let ticket = tickets.find(
          (item) =>
            item.zone_code === report.zone_code &&
            ["received", "assigned", "verifying"].includes(item.status) &&
            Date.now() - Date.parse(item.created_at) <= 900000,
        );
        const created = !ticket;
        if (ticket) {
          ticket.source =
            report.emergency || ticket.source === "emergency"
              ? "emergency"
              : ["sensor", "both"].includes(ticket.source)
                ? "both"
                : "report";
          ticket.priority =
            ticket.source === "emergency"
              ? "urgent"
              : ticket.source === "both"
                ? "high"
                : ticket.priority;
          ticket.updated_at = now;
        } else {
          ticket = {
            code: `SF-${now.slice(2, 10).replaceAll("-", "")}-${String(++sequence).padStart(3, "0")}`,
            zone_code: report.zone_code,
            source: report.emergency ? "emergency" : "report",
            priority: report.emergency ? "urgent" : "normal",
            status: "received",
            created_at: now,
            updated_at: now,
            due_at: new Date(Date.now() + 900000).toISOString(),
            assignee_id: null,
            presence: null,
          };
          tickets.unshift(ticket);
        }
        // Không lưu note/device_token vào phiếu; máy chủ này không triển khai tra cứu SV.
        for (const socket of io.sockets.sockets.values()) {
          if (userFor(socket.data.token))
            socket.emit(created ? "ticket:created" : "ticket:updated", ticket);
          else socket.disconnect(true);
        }
        return json(res, 201, {
          tracking_code: randomBytes(8).toString("hex").toUpperCase(),
          status: "received",
        });
      }
      const user = userFor(token);
      if (!user)
        return json(res, 401, {
          message: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.",
        });
      if (req.method === "GET" && url.pathname === "/api/auth/me")
        return json(res, 200, { user });
      if (req.method === "POST" && url.pathname === "/api/auth/logout") {
        sessions.delete(token!);
        for (const socket of io.sockets.sockets.values())
          if (socket.data.token === token) socket.disconnect(true);
        return json(res, 200, { ok: true });
      }
      if (req.method === "GET" && url.pathname === "/api/zones")
        return json(res, 200, {
          items: zones,
          coordinates_status: "provisional",
        });
      if (req.method === "GET" && url.pathname === "/api/tickets") {
        const status = url.searchParams.get("status");
        const zone = url.searchParams.get("zone_code");
        if (status && !statuses.includes(status as (typeof statuses)[number]))
          return json(res, 400, { message: "Trạng thái không hợp lệ." });
        return json(res, 200, {
          items: tickets
            .filter(
              (item) =>
                (!status || item.status === status) &&
                (!zone || item.zone_code === zone),
            )
            .sort(
              (a, b) =>
                b.created_at.localeCompare(a.created_at) ||
                b.code.localeCompare(a.code),
            ),
        });
      }
      return json(res, 404, {
        message: "Chức năng chưa có trên máy chủ thử D2.",
      });
    } catch {
      return json(res, 400, { message: "Yêu cầu không hợp lệ." });
    }
  });
  const io = new Server(http, { cors: { origin: [...allowedOrigins] } });
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!userFor(token)) return next(new Error("unauthorized"));
    socket.data.token = token;
    next();
  });
  return { http, io, tickets };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { http } = createTestServer();
  const port = Number(process.env.PORT || 3001);
  http.listen(port, "127.0.0.1", () =>
    console.log(
      `API tích hợp cục bộ: http://127.0.0.1:${port} (dữ liệu RAM, toạ độ tạm)`,
    ),
  );
}
