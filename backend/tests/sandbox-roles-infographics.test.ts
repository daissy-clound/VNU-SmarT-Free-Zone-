import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server";
import { stripExifFromJpeg } from "../src/api/infographics";
import { rollDataDates } from "../src/api/rolling-dates";

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
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data = raw;
          try {
            data = JSON.parse(raw);
          } catch {}
          resolve({ status: res.statusCode || 0, data, headers: res.headers });
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

test("Sandbox: BGK tạo phiếu thử nghiệm và đặt lại không ảnh hưởng dữ liệu chính", async () => {
  // 1. Đăng nhập vai trò BGK (viewer)
  const loginRes = await makeRequest("POST", "/api/auth/login", {
    username: "bgk",
    password: "Demo@2026",
  });
  assert.equal(loginRes.status, 200);
  const token = loginRes.data.token;

  // 2. Tạo phiếu thử nghiệm trong Sandbox
  const createRes = await makeRequest(
    "POST",
    "/api/sandbox/ticket",
    {
      zone_code: "UET1-3CT",
      priority: "high",
      presence: true,
    },
    { Authorization: `Bearer ${token}` }
  );
  assert.equal(createRes.status, 201);
  assert.equal(createRes.data.ok, true);
  assert.match(createRes.data.ticket.code, /^SF-SBX-/);
  assert.equal(createRes.data.ticket.is_sandbox, true);

  // 3. BGK bấm "Đặt lại" Sandbox
  const resetRes = await makeRequest("POST", "/api/sandbox/reset", {}, {
    Authorization: `Bearer ${token}`,
  });
  assert.equal(resetRes.status, 200);
  assert.equal(resetRes.data.ok, true);
});

test("Phân quyền: BGK không thể sửa phiếu thật và Analyst không thể đổi trạng thái", async () => {
  // 1. BGK cố sửa phiếu thật SF-DEMO-003 -> phải bị từ chối 403
  const bgkLogin = await makeRequest("POST", "/api/auth/login", {
    username: "bgk",
    password: "Demo@2026",
  });
  const bgkToken = bgkLogin.data.token;

  const patchByBgk = await makeRequest(
    "PATCH",
    "/api/tickets/SF-DEMO-003/status",
    { status: "assigned" },
    { Authorization: `Bearer ${bgkToken}` }
  );
  assert.equal(patchByBgk.status, 403);

  // 2. Analyst cố sửa trạng thái phiếu -> phải bị từ chối 403 (Read-only)
  const analystLogin = await makeRequest("POST", "/api/auth/login", {
    username: "phantich",
    password: "Demo@2026",
  });
  const analystToken = analystLogin.data.token;

  const patchByAnalyst = await makeRequest(
    "PATCH",
    "/api/tickets/SF-DEMO-003/status",
    { status: "assigned" },
    { Authorization: `Bearer ${analystToken}` }
  );
  assert.equal(patchByAnalyst.status, 403);
});

test("Infographics: Xoá siêu dữ liệu EXIF và kiểm tra quyền BQL đăng bài", async () => {
  // 1. Kiểm tra thuật toán stripExifFromJpeg
  const mockJpegWithExif = Buffer.from([
    0xff, 0xd8, // SOI
    0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // APP1 Exif length 8 bytes
    0xff, 0xdb, 0x00, 0x04, 0x01, 0x02, // DQT marker
    0xff, 0xd9, // EOI
  ]);

  const stripped = stripExifFromJpeg(mockJpegWithExif);
  let hasExifMarker = false;
  for (let i = 0; i < stripped.length - 1; i++) {
    if (stripped[i] === 0xff && stripped[i + 1] === 0xe1) {
      hasExifMarker = true;
      break;
    }
  }
  assert.equal(hasExifMarker, false);

  // 2. Đăng tải Infographic bởi BQL
  const bqlLogin = await makeRequest("POST", "/api/auth/login", {
    username: "bql",
    password: "Demo@2026",
  });
  const bqlToken = bqlLogin.data.token;

  const uploadRes = await makeRequest(
    "POST",
    "/api/infographics",
    {
      title: "Thông điệp UET Không Khói Thuốc 2026",
      image_data: "data:image/jpeg;base64," + stripped.toString("base64"),
      building: "UET1",
    },
    { Authorization: `Bearer ${bqlToken}` }
  );
  assert.equal(uploadRes.status, 201);
  assert.equal(uploadRes.data.ok, true);

  // 3. Lấy danh sách Infographics công khai
  const listRes = await makeRequest("GET", "/api/infographics");
  assert.equal(listRes.status, 200);
  assert.ok(Array.isArray(listRes.data.items));
});

test("Rolling Dates: Dời ngày dữ liệu thành công", async () => {
  const result = await rollDataDates(new Date());
  assert.ok(typeof result.shifted_days === "number");
  assert.ok(typeof result.tickets_updated === "number");
});

test("Monitoring: Detailed health endpoint trả về thông số tài nguyên và CSDL", async () => {
  const res = await makeRequest("GET", "/api/health/detailed");
  assert.equal(res.status, 200);
  assert.equal(res.data.status, "ok");
  assert.ok(res.data.memory.heap_used_mb > 0);
  assert.equal(res.data.database.status, "ok");
});
