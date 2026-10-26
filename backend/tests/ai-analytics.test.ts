import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server";
import { smokeDetector, smokeClassifier, hotspotForecast, llmAnalytics, getModelTransparencyMetrics } from "../src/ai";
import { TelemetryMessage } from "../src/contracts/telemetry";

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
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: testPort,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload).toString() } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch {
            data = raw;
          }
          resolve({ status: res.statusCode || 500, data });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test("AI Tầng 1: SmokeAnomalyDetector phát hiện khói bất thường và lọc nhiễu", () => {
  smokeDetector.reset();

  const normalMsg: TelemetryMessage = {
    node_id: "UET1-3CT",
    ts: new Date().toISOString(),
    seq: 1,
    pm1: 8.5,
    pm25: 12.0,
    pm10: 14.2,
    nc: 45.0,
    typ_size: 0.45,
    temp: 26.5,
    rh: 65.0,
    presence: false,
    presence_age: 120,
    rssi: -65,
    fw: "0.3.0",
    late: false,
  };

  const res1 = smokeDetector.evaluate(normalMsg);
  assert.equal(res1.is_anomaly, false);

  // Giả lập khói thuốc lá tăng vọt + PIR bật
  const smokeMsg: TelemetryMessage = {
    ...normalMsg,
    seq: 2,
    pm1: 45.0,
    pm25: 68.5,
    pm10: 72.0,
    nc: 350.0,
    presence: true,
    presence_age: 2,
  };
  const res2 = smokeDetector.evaluate(smokeMsg);
  assert.equal(res2.is_anomaly, true);
  assert.equal(res2.presence_status, "present");
  assert.ok(res2.confidence >= 0.7);

  // Lọc hơi nước: RH > 85%
  const steamMsg: TelemetryMessage = {
    ...normalMsg,
    seq: 3,
    pm25: 55.0,
    rh: 92.0,
  };
  const res3 = smokeDetector.evaluate(steamMsg);
  assert.equal(res3.is_anomaly, false);
  assert.equal(res3.suggested_class, "steam");
});

test("AI Tầng 2: SmokeEventClassifier phân loại đợt khói chính xác", () => {
  const baseTime = Date.now();

  const vapeTelemetries: TelemetryMessage[] = Array.from({ length: 8 }, (_, i) => ({
    node_id: "UET2-4ST",
    ts: new Date(baseTime + i * 15 * 1000).toISOString(),
    seq: i,
    pm1: i === 3 ? 82.0 : 20.0,
    pm25: i === 3 ? 95.0 : 25.0,
    pm10: i === 3 ? 98.0 : 28.0,
    nc: i === 3 ? 850.0 : 100.0,
    typ_size: 0.38,
    temp: 27.0,
    rh: 62.0,
    presence: true,
    presence_age: 1,
    rssi: -60,
    fw: "0.3.0",
    late: false,
  }));

  const vapeResult = smokeClassifier.classify(vapeTelemetries);
  assert.equal(vapeResult.event_class, "vape");
  assert.ok(vapeResult.confidence >= 0.8);
  assert.ok(vapeResult.features.pm1_pm25_ratio >= 0.65);
});

test("AI Forecast & LLM Analytics Service", () => {
  const forecast = hotspotForecast.generateForecast();
  assert.ok(forecast.top_hotspots.length > 0);
  assert.equal(forecast.recommended_patrol_shifts.length, 6);
  assert.ok(forecast.comparison_simulation.ai_suggested_coverage > 80);

  // Kiểm tra che PII
  const rawNote = "Thấy anh K58 phòng 402 gọi số 0987654321 hút thuốc ở chiếu nghỉ";
  const masked = llmAnalytics.maskPii(rawNote);
  assert.ok(!masked.includes("0987654321"));
  assert.ok(masked.includes("[SĐT ĐÃ CHE]"));
  assert.ok(masked.includes("[PHÒNG ĐÃ CHE]"));

  // Kiểm tra phân loại ghi chú khẩn cấp
  const urgentNote = llmAnalytics.classifyNote("Có khói bốc cháy dữ dội ở tầng 4");
  assert.equal(urgentNote.category, "urgent");
  assert.equal(urgentNote.suggested_priority, "urgent");

  // Kiểm tra sinh báo cáo tuần
  const weekly = llmAnalytics.generateWeeklyReport();
  assert.ok(weekly.content_markdown.includes("BÁO CÁO TUẦN"));
  assert.ok(weekly.action_items.length >= 3);

  // Kiểm tra metrics minh bạch thuật toán
  const metrics = getModelTransparencyMetrics();
  assert.ok(metrics.overall.accuracy >= 0.9);
  assert.equal(metrics.metrics_by_class.length, 6);
  assert.equal(metrics.stress_test_results.length, 3);
});

test("API: Endpoints /api/stats trả về Heatmap, Forecast, Transparency, Weekly-report", async () => {
  const resHeatmap = await makeRequest("GET", "/api/stats/heatmap");
  assert.equal(resHeatmap.status, 200);
  assert.ok(resHeatmap.data.heatmap.length > 0);
  assert.equal(resHeatmap.data.heatmap[0].hourly_suspected.length, 24);

  const resForecast = await makeRequest("GET", "/api/stats/forecast");
  assert.equal(resForecast.status, 200);
  assert.ok(resForecast.data.top_hotspots.length >= 5);

  const resTransparency = await makeRequest("GET", "/api/stats/transparency");
  assert.equal(resTransparency.status, 200);
  assert.equal(resTransparency.data.confusion_matrix.classes.length, 6);

  const resReport = await makeRequest("GET", "/api/stats/weekly-report");
  assert.equal(resReport.status, 200);
  assert.ok(resReport.data.content_markdown.length > 100);
});
