import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server";
import { telemetryIngestService } from "../src/ingest/mqtt";

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
): Promise<{ status: number; data: any }> {
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
          resolve({ status: res.statusCode || 500, data });
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

test("Ingest: Bản tin bình thường không kích hoạt mở phiếu", async () => {
  const normalTelemetry = {
    node_id: "UET1-3CT",
    ts: new Date().toISOString(),
    seq: 1,
    pm1: 8.5,
    pm25: 14.2,
    pm10: 16.0,
    nc: 120.0,
    typ_size: 0.52,
    temp: 26.5,
    rh: 62.0,
    presence: false,
    presence_age: 45,
    rssi: -58,
    fw: "0.3.0",
    late: false,
  };

  const result = await telemetryIngestService.processTelemetry(normalTelemetry);
  assert.equal(result.status, "normal");
});

test("Ingest & Anomaly: PM2.5 vượt ngưỡng tự động mở phiếu & thông báo ca trực", async () => {
  const smokeTelemetry = {
    node_id: "UET4-4ST",
    ts: new Date().toISOString(),
    seq: 2,
    pm1: 45.0,
    pm25: 72.8, // Vượt ngưỡng khói 35 ug/m3
    pm10: 78.0,
    nc: 450.0,
    typ_size: 0.42,
    temp: 28.0,
    rh: 65.0,
    presence: true, // Có người tại chỗ (PIR bật)
    presence_age: 1,
    rssi: -55,
    fw: "0.3.0",
    late: false,
  };

  const result = await telemetryIngestService.processTelemetry(smokeTelemetry);
  assert.equal(result.status, "anomaly_detected");
  assert.ok(result.ticket);
  assert.equal(result.ticket.zone_code, "UET4-4ST");
  assert.equal(result.ticket.source, "sensor");
  assert.equal(result.ticket.presence, true);
  assert.equal(result.ticket.priority, "urgent"); // PIR bật -> nâng lên urgent

  // Kiểm tra gộp nguồn: Sinh viên gửi tiếp phản ánh tại UET4-4ST trong 15 phút
  const reportRes = await makeRequest("POST", "/api/reports", {
    zone_code: "UET4-4ST",
    type: "smoke_now",
    ongoing: true,
    emergency: false,
    note: "Có khói trên sân thượng UET4",
    device_token: "anon-device-token-uet4",
  });
  assert.equal(reportRes.status, 201);
  assert.equal(reportRes.data.ticket_code, result.ticket.code); // Gộp chung mã phiếu
});

test("Web Push: Lấy VAPID public key và đăng ký nhận cảnh báo ca trực", async () => {
  // 1. Lấy public key
  const vapidRes = await makeRequest("GET", "/api/notify/vapid-public-key");
  assert.equal(vapidRes.status, 200);
  assert.ok(vapidRes.data.publicKey);

  // 2. Đăng ký nhận thông báo
  const subRes = await makeRequest("POST", "/api/notify/subscribe", {
    endpoint: "https://fcm.googleapis.com/fcm/send/test-token-catruc",
    user_id: "catruc",
    device_name: "iPhone ca trực PWA",
  });
  assert.equal(subRes.status, 200);
  assert.equal(subRes.data.ok, true);

  // 3. Test gửi thông báo
  const testRes = await makeRequest("POST", "/api/notify/test", {
    zone_code: "UET1-3CT",
    presence: true,
  });
  assert.equal(testRes.status, 200);
  assert.equal(testRes.data.ok, true);
});

test("SLA & Escalation: Kiểm tra danh sách phiếu quá hạn", async () => {
  const overdueRes = await makeRequest("GET", "/api/tickets/overdue");
  assert.equal(overdueRes.status, 200);
  assert.ok(overdueRes.data.count >= 1);
  assert.ok(Array.isArray(overdueRes.data.items));
  // Phiếu quá hạn được gắn nhãn chuyển cấp
  assert.equal(overdueRes.data.items[0].is_overdue, true);
  assert.equal(overdueRes.data.items[0].escalated, true);
});

test("Ingest Wokwi ESP32 (Đức): Tự động nhận diện bản tin mô phỏng ESP32 và mở phiếu khi có khói", async () => {
  const wokwiPayload = {
    device_id: "sensor_01",
    smoke_raw: 2200, // Vượt ngưỡng 1800
    smoke_detected: true,
    presence: true,
    alarm: true,
  };

  const result = await telemetryIngestService.processTelemetry(wokwiPayload);
  assert.equal(result.status, "anomaly_detected");
  assert.ok(result.ticket);
  assert.ok(result.ticket.code.startsWith("SF-"));
});

