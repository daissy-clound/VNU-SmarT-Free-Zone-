import test from "node:test";
import assert from "node:assert/strict";
import type { Ticket, TicketHistory, TicketStatus } from "../../../backend/src/contracts";
import {
  arrivalTime,
  availableActions,
  canAct,
  isFalseAlarm,
  planSteps,
  verifyNote,
} from "../src/workflow";

/** Luật 3 nút ca trực và quyền thao tác trên trang chi tiết phiếu */
const ticket = (status: TicketStatus, extra: Partial<Ticket> = {}): Ticket => ({
  code: "SF-T-001",
  zone_code: "UET1-3CT",
  source: "report",
  priority: "normal",
  status,
  created_at: "2026-10-21T15:10:00.000Z",
  updated_at: "2026-10-21T15:10:00.000Z",
  due_at: "2026-10-21T15:25:00.000Z",
  assignee_id: null,
  presence: true,
  ...extra,
});
const hist = (from: TicketStatus | null, to: TicketStatus, at: string, note = ""): TicketHistory => ({
  id: at,
  ticket_code: "SF-T-001",
  from_status: from,
  to_status: to,
  action: from === null ? "create" : "status_change",
  performed_by_id: "usr_catruc",
  note,
  created_at: at,
});

test("Đang đến: nhận phiếu cho chính mình, chỉ ở bước Tiếp nhận", () => {
  assert.deepEqual(planSteps("received", "en_route").map((s) => [s.status, s.assignToSelf]), [["assigned", true]]);
  assert.deepEqual(planSteps("assigned", "en_route"), []);
});

test("Đã đến: đi đủ từng bước tới Đang xác minh, không nhảy cóc", () => {
  assert.deepEqual(planSteps("received", "arrived").map((s) => s.status), ["assigned", "verifying"]);
  assert.deepEqual(planSteps("assigned", "arrived").map((s) => s.status), ["verifying"]);
  assert.deepEqual(planSteps("verifying", "arrived"), []);
});

test("Báo nhầm: chuyển sang Đã xử lý kèm ghi chú 'Báo nhầm', đi qua đủ bước trước đó", () => {
  const steps = planSteps("received", "false_alarm", "Xác minh — Còn mùi khói: Không");
  assert.deepEqual(steps.map((s) => s.status), ["assigned", "verifying", "handled"]);
  assert.match(steps[2].note, /^Báo nhầm/);
  assert.match(steps[2].note, /Còn mùi khói: Không/);
  assert.deepEqual(planSteps("handled", "false_alarm"), []);
});

test("Câu hỏi xác minh nhanh ghi thành ghi chú, không có tên người vi phạm", () => {
  assert.equal(verifyNote({}), "");
  assert.equal(verifyNote({ smell: "yes", seen: "unknown" }), "Xác minh — Còn mùi khói: Có · Thấy người đang hút: Không rõ");
});

test("Chỉ hiện nút được phép ở bước hiện tại, theo vai trò", () => {
  assert.deepEqual(availableActions("guard", ticket("received")), ["en_route", "arrived", "false_alarm"]);
  assert.deepEqual(availableActions("guard", ticket("verifying")), ["false_alarm", "resolve"]);
  assert.deepEqual(availableActions("guard", ticket("handled")), [], "phản hồi SV thuộc BQL");
  assert.deepEqual(availableActions("manager", ticket("handled")), ["respond"]);
  assert.deepEqual(availableActions("manager", ticket("responded")), ["close"]);
  assert.deepEqual(availableActions("manager", ticket("closed")), []);
  assert.deepEqual(availableActions("analyst", ticket("received")), []);
  assert.equal(canAct("viewer", ticket("received"), "arrived"), false);
  assert.equal(canAct("viewer", ticket("received", { is_sandbox: true }), "arrived"), true);
});

test("Giờ tới hiện trường = lần đầu chuyển sang Đang xác minh; nhận biết báo nhầm", () => {
  const h = [
    hist(null, "received", "2026-10-21T15:10:00.000Z"),
    hist("received", "assigned", "2026-10-21T15:12:00.000Z"),
    hist("assigned", "verifying", "2026-10-21T15:18:30.000Z"),
    hist("verifying", "handled", "2026-10-21T15:20:00.000Z", "Báo nhầm: không phát hiện vi phạm"),
  ];
  assert.equal(arrivalTime(h), "2026-10-21T15:18:30.000Z");
  assert.equal(arrivalTime(h.slice(0, 2)), null);
  assert.equal(isFalseAlarm(h), true);
  assert.equal(isFalseAlarm(h.slice(0, 3)), false);
});
