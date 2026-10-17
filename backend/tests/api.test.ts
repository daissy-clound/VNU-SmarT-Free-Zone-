import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server";

let testServer: http.Server;
let testPort: number;

before(async () => {
  await new Promise<void>((resolve) => {
    testServer = http.createServer(app);
    testServer.listen(0, "127.0.0.1", () => {
      const addr = testServer.address() as any;
      testPort = addr.port;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve) => {
    testServer.close(() => resolve());
  });
});

// Helper để test HTTP request
function makeRequest(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };
    if (payload) {
      reqHeaders["Content-Length"] = Buffer.byteLength(payload).toString();
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: testPort,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          let data = rawData;
          try {
            data = JSON.parse(rawData);
          } catch {}
          resolve({
            status: res.statusCode || 500,
            data,
            headers: res.headers,
          });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

test("API: GET /api/health trả về status ok", async () => {
  const res = await makeRequest("GET", "/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.data.status, "ok");
  assert.equal(res.data.service, "sfz-backend");
});

test("API: GET /api/zones trả về đủ 20 khu vực", async () => {
  const res = await makeRequest("GET", "/api/zones");
  assert.equal(res.status, 200);
  assert.equal(res.data.items.length, 20);
  assert.equal(res.data.coordinates_status, "approved");
});

test("API: GET /api/tickets trả về danh sách phiếu mẫu", async () => {
  const res = await makeRequest("GET", "/api/tickets");
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data.items));
  assert.ok(res.data.items.length >= 6);
});

test("API: POST /api/auth/login và GET /api/auth/me", async () => {
  // 1. Đăng nhập với tài khoản BQL
  const loginRes = await makeRequest("POST", "/api/auth/login", {
    username: "bql",
    password: "Demo@2026",
  });
  assert.equal(loginRes.status, 200);
  assert.ok(loginRes.data.token);
  assert.equal(loginRes.data.user.role, "manager");

  // 2. Kiểm tra phiên đăng nhập với token
  const meRes = await makeRequest("GET", "/api/auth/me", undefined, {
    Authorization: `Bearer ${loginRes.data.token}`,
  });
  assert.equal(meRes.status, 200);
  assert.equal(meRes.data.user.username, undefined); // Không lộ pass
  assert.equal(meRes.data.user.role, "manager");
});

test("API: POST /api/reports tiếp nhận phản ánh, cấp mã tra cứu & GET /api/reports/track/:code", async () => {
  // Sinh viên gửi phản ánh
  const reportPayload = {
    zone_code: "B5-CTD",
    type: "smoke_now",
    ongoing: true,
    emergency: false,
    note: "Có bạn hút thuốc ở chiếu nghỉ, SĐT tôi 0987654321",
    device_token: "anon-device-token-xyz",
  };

  const res = await makeRequest("POST", "/api/reports", reportPayload);
  assert.equal(res.status, 201);
  assert.ok(res.data.tracking_code);
  assert.match(res.data.tracking_code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);

  // Sinh viên tra cứu bằng mã tra cứu
  const trackRes = await makeRequest(
    "GET",
    `/api/reports/track/${res.data.tracking_code}`
  );
  assert.equal(trackRes.status, 200);
  assert.equal(trackRes.data.tracking_code, res.data.tracking_code);
  assert.equal(trackRes.data.zone_code, "B5-CTD");
  assert.ok(trackRes.data.status_label);
});

test("API: PATCH /api/tickets/:code/status chuyển trạng thái phiếu", async () => {
  // Chuyển từ received sang assigned
  const res = await makeRequest("PATCH", "/api/tickets/SF-DEMO-001/status", {
    status: "assigned",
    assignee_id: "usr_catruc",
    note: "Đã phân công ca trực tiếp cận",
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.ticket.status, "assigned");
});
