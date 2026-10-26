import test, { after, before, mock } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { app } from "../src/server";
import { isOfficeHours, suggestRoom } from "../src/contracts/dispatch";
import { dispatchService } from "../src/dispatch/service";

let server: http.Server;
let base = "";

before(async () => {
  server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: (await res.json()) as any };
}
const login = async (username: string) =>
  (await call("POST", "/api/auth/login", { username, password: "Demo@2026" })).data.token as string;
const newTicket = async (zone_code: string) =>
  (
    await call("POST", "/api/reports", {
      zone_code,
      type: "smoke_now",
      ongoing: true,
      emergency: false,
      device_token: `dispatch-${zone_code}-${Math.random()}`,
    })
  ).data.ticket_code as string;

test("giờ hành chính theo giờ Việt Nam; ngoài giờ đề xuất Phòng bảo vệ", () => {
  // Thứ 4 22/10/2026 09:00 giờ VN = 02:00 UTC
  const weekdayMorning = new Date("2026-10-22T02:00:00Z");
  const weekdayEvening = new Date("2026-10-22T12:30:00Z"); // 19:30 VN
  const saturday = new Date("2026-10-24T03:00:00Z"); // thứ 7, 10:00 VN
  assert.equal(isOfficeHours(weekdayMorning), true);
  assert.equal(isOfficeHours(weekdayEvening), false);
  assert.equal(isOfficeHours(saturday), false);
  assert.equal(suggestRoom("UET2", weekdayMorning).room.id, "PT-UET2");
  assert.equal(suggestRoom("UET2", weekdayEvening).room.id, "PBV");
  assert.match(suggestRoom("UET2", weekdayEvening).reason, /Ngoài giờ hành chính/);
  assert.equal(suggestRoom("DN", weekdayMorning).room.id, "PBV");
  assert.equal(suggestRoom("CONG", weekdayEvening).room.id, "PBV");
});

test("BQL điều phối → chỉ phòng trực được giao thấy và thao tác; người nhận được ghi lại", async () => {
  const bql = await login("bql");
  const uet2 = await login("trucuet2");
  const uet3 = await login("trucuet3");
  const code = await newTicket("UET2-3CT");

  // Chưa điều phối: phòng trực chưa thấy, không thao tác được
  let list = (await call("GET", "/api/tickets", undefined, uet2)).data.items;
  assert.equal(list.some((t: any) => t.code === code), false);
  assert.equal((await call("PATCH", `/api/tickets/${code}/status`, { status: "assigned" }, uet2)).status, 403);

  // Chỉ Ban quản lý được điều phối
  assert.equal((await call("POST", "/api/dispatch", { ticket_code: code, room_id: "PT-UET2" }, uet2)).status, 403);
  const sent = await call("POST", "/api/dispatch", { ticket_code: code, room_id: "PT-UET2", note: "Cảm biến + 1 phản ánh" }, bql);
  assert.equal(sent.status, 201);
  assert.equal(sent.data.dispatch.status, "waiting");

  list = (await call("GET", "/api/tickets", undefined, uet2)).data.items;
  assert.equal(list.some((t: any) => t.code === code), true);
  list = (await call("GET", "/api/tickets", undefined, uet3)).data.items;
  assert.equal(list.some((t: any) => t.code === code), false, "phòng trực toà khác không thấy");
  assert.equal((await call("PATCH", `/api/tickets/${code}/status`, { status: "assigned" }, uet3)).status, 403);
  const mine = (await call("GET", "/api/dispatch", undefined, uet3)).data.items;
  assert.equal(mine.some((d: any) => d.ticket_code === code), false);

  // Cán bộ UET2 nhận
  const accept = await call(
    "PATCH",
    `/api/tickets/${code}/status`,
    { status: "assigned", assignee_id: "usr_truc_uet2_a", note: "Nhận kiểm tra" },
    uet2,
  );
  assert.equal(accept.status, 200);
  const d = (await call("GET", "/api/dispatch", undefined, bql)).data.items.find((x: any) => x.ticket_code === code);
  assert.equal(d.status, "accepted");
  assert.equal(d.accepted_by_name, "Trực giảng UET2 · Cán bộ A");

  // Đã có người nhận: không điều phối lại; đồng nghiệp cùng phòng không thao tác thay
  assert.equal((await call("POST", "/api/dispatch", { ticket_code: code, room_id: "PBV" }, bql)).status, 409);
  const uet2b = await login("trucuet2b");
  assert.equal((await call("PATCH", `/api/tickets/${code}/status`, { status: "verifying" }, uet2b)).status, 403);

  const rooms = (await call("GET", "/api/dispatch/rooms", undefined, bql)).data;
  const room = rooms.items.find((r: any) => r.id === "PT-UET2");
  assert.equal(room.staff.find((s: any) => s.id === "usr_truc_uet2_a").active_tickets, 1);
  assert.equal(rooms.items.length, 5);

  const history = (await call("GET", `/api/tickets/${code}`)).data.history;
  assert.ok(history.some((h: any) => h.action === "dispatch" && /Phòng trực giảng UET2/.test(h.note)));
});

test("quá 3 phút chưa nhận → trạng thái quá hạn, báo Ban quản lý kèm số điện thoại; ghi nhận cuộc gọi", async () => {
  const code = await newTicket("UET4-2CT");
  const events: [string, any][] = [];
  dispatchService.setEmitter((e, d) => events.push([e, d]));
  mock.timers.enable({ apis: ["Date", "setTimeout"], now: Date.now() });
  try {
    dispatchService.dispatch(code, "PT-UET4", { id: "usr_bql", name: "Ban quản lý" });
    assert.equal(dispatchService.get(code)?.status, "waiting");
    mock.timers.tick(181_000);
    assert.equal(dispatchService.get(code)?.status, "overdue");
    const overdue = events.find(([e]) => e === "dispatch:overdue")?.[1];
    assert.ok(overdue, "phát dispatch:overdue");
    assert.equal(overdue.room_phone, "024 0000 1104");
    const called = dispatchService.call(code, { id: "usr_bql", name: "Ban quản lý" });
    assert.equal(called.calls.length, 1);
  } finally {
    mock.timers.reset();
  }
});
