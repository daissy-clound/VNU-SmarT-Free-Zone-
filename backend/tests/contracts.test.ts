import test from "node:test";
import assert from "node:assert/strict";
import {
  telemetrySchema,
  reportSchema,
  ticketSchema,
  statuses,
  DEFAULT_ZONES,
} from "../src/contracts";
import {
  sanitizeNote,
  generateTrackingCode,
  generateTicketCode,
} from "../src/tickets/sanitizer";
import {
  canTransition,
  calculateSLA,
  shouldMergeReport,
  resolveMergedSourceAndPriority,
} from "../src/tickets/machine";

test("Hợp đồng 1: Bản tin cảm biến (Telemetry) hợp lệ", () => {
  const sample = {
    node_id: "B5-CTD",
    ts: "2026-10-20T22:10:05+07:00",
    seq: 18234,
    pm1: 41.2,
    pm25: 58.7,
    pm10: 63.0,
    nc: 312.5,
    typ_size: 0.48,
    temp: 29.4,
    rh: 71.5,
    presence: true,
    presence_age: 3,
    rssi: -61,
    fw: "0.3.0",
    late: false,
  };

  const parsed = telemetrySchema.safeParse(sample);
  assert.equal(parsed.success, true);
});

test("Hợp đồng 2: Phản ánh sinh viên (Report) & Che thông tin nhạy cảm (PII)", () => {
  const rawNote = "SV 21020123 phòng 502 thấy khói, liên hệ SĐT 0912345678 hoặc abc@vnu.edu.vn";
  const cleaned = sanitizeNote(rawNote);

  assert.equal(cleaned.includes("0912345678"), false, "Phải che SĐT");
  assert.equal(cleaned.includes("21020123"), false, "Phải che mã SV");
  assert.equal(cleaned.includes("abc@vnu.edu.vn"), false, "Phải che email");
  assert.equal(cleaned.includes("[SĐT_ĐÃ_CHE]"), true);
  assert.equal(cleaned.includes("[MÃ_SV_ĐÃ_CHE]"), true);
  assert.equal(cleaned.includes("[EMAIL_ĐÃ_CHE]"), true);

  const reportPayload = {
    zone_code: "B5-CTD",
    type: "smoke_now",
    ongoing: true,
    emergency: false,
    note: cleaned,
    device_token: "anon-device-token-1234",
  };

  const parsed = reportSchema.safeParse(reportPayload);
  assert.equal(parsed.success, true);
});

test("Mã tra cứu ngẫu nhiên: định dạng K7Q2-9XMA", () => {
  const code = generateTrackingCode();
  assert.match(code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
});

test("Mã phiếu nội bộ: định dạng SF-YYMMDD-XXX", () => {
  const ticketCode = generateTicketCode(42);
  assert.match(ticketCode, /^SF-\d{6}-042$/);
});

test("Hợp đồng 3: Máy trạng thái 6 bước (State Machine)", () => {
  // Đúng thứ tự
  assert.equal(canTransition("received", "assigned"), true);
  assert.equal(canTransition("assigned", "verifying"), true);
  assert.equal(canTransition("verifying", "handled"), true);
  assert.equal(canTransition("handled", "responded"), true);
  assert.equal(canTransition("responded", "closed"), true);

  // Nhảy cóc không hợp lệ
  assert.equal(canTransition("received", "closed"), false);
  assert.equal(canTransition("assigned", "responded"), false);
  assert.equal(canTransition("closed", "received"), false);
});

test("Gộp nguồn & Nâng mức ưu tiên", () => {
  const existingTicket = {
    code: "SF-261016-001",
    zone_code: "B5-CTD",
    source: "sensor" as const,
    priority: "normal" as const,
    status: "received" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    due_at: null,
    assignee_id: null,
    presence: true,
  };

  // Cùng khu vực trong vòng 15 phút -> Gộp
  assert.equal(shouldMergeReport(existingTicket, "B5-CTD", 15), true);
  // Khác khu vực -> Không gộp
  assert.equal(shouldMergeReport(existingTicket, "A2-WC", 15), false);

  // Khi có cả sensor và report -> Nguồn thành 'both' và ưu tiên nâng lên 'high'
  const merged = resolveMergedSourceAndPriority("sensor", "normal", "report", false);
  assert.equal(merged.source, "both");
  assert.equal(merged.priority, "high");

  // Nút khẩn cấp -> 'emergency' và 'urgent'
  const emergencyMerged = resolveMergedSourceAndPriority("sensor", "normal", "report", true);
  assert.equal(emergencyMerged.source, "emergency");
  assert.equal(emergencyMerged.priority, "urgent");
});

test("Danh mục 25 khu vực & 10 nút cảm biến UET Hoà Lạc", () => {
  assert.equal(DEFAULT_ZONES.length, 25);
  const sensors = DEFAULT_ZONES.filter((z) => z.sensor_id !== null);
  assert.equal(sensors.length, 10);
});
