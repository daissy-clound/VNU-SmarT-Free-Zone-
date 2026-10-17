import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { io as client } from "socket.io-client";
import { createTestServer } from "../scripts/test-server/server";
import { zones } from "../scripts/test-server/fixtures";
import { ticketListSchema } from "../backend/src/contracts";

const server = createTestServer({ seed: false });
let base: string;
let token: string;
const report = {
  zone_code: "B5-CTD",
  type: "smoke_now",
  ongoing: true,
  emergency: false,
  note: "",
  device_token: "test-anonymous",
};
const post = (path: string, data: unknown) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
before(async () => {
  await new Promise<void>((resolve) =>
    server.http.listen(0, "127.0.0.1", resolve),
  );
  const address = server.http.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}`;
  token = (
    await (
      await post("/api/auth/login", { username: "bql", password: "Demo@2026" })
    ).json()
  ).token;
});
after(async () => {
  await new Promise<void>((resolve) => server.io.close(() => resolve()));
});

test("10 cảm biến đúng mục 4, 20 QR duy nhất, đủ toà A/B × 6 tầng", () => {
  assert.equal(zones.length, 20);
  assert.equal(new Set(zones.map((zone) => zone.qr_id)).size, 20);
  assert.deepEqual(
    zones.filter((zone) => zone.sensor_id).map((zone) => zone.sensor_id),
    [
      "A2-WC",
      "A3-CTT",
      "A4-HL",
      "A5-CTD",
      "A6-ST",
      "B2-WC",
      "B3-CTT",
      "B4-HL",
      "B5-CTD",
      "B6-ST",
    ],
  );
  assert.equal(
    new Set(zones.map((zone) => `${zone.building}${zone.floor}`)).size,
    12,
  );
});
test("API yêu cầu xác thực, sai mật khẩu bị từ chối", async () => {
  assert.equal((await fetch(`${base}/api/tickets`)).status, 401);
  assert.equal(
    (await post("/api/auth/login", { username: "bql", password: "wrong" }))
      .status,
    401,
  );
});
test("phản ánh của B sinh phiếu thật qua HTTP và phát sự kiện socket", async () => {
  const socket = client(base, { auth: { token }, transports: ["websocket"] });
  try {
    await new Promise<void>((resolve, reject) => {
      socket.on("connect", resolve);
      socket.on("connect_error", reject);
    });
    const event = new Promise<any>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("Không nhận được sự kiện phiếu")),
        3000,
      );
      socket.once("ticket:created", (ticket) => {
        clearTimeout(timer);
        resolve(ticket);
      });
    });
    const result = await post("/api/reports", report);
    assert.equal(result.status, 201);
    assert.ok((await result.json()).tracking_code);
    const ticket = await event;
    assert.equal(ticket.zone_code, "B5-CTD");
    assert.equal(ticket.source, "report");
    const resultList = await fetch(
      `${base}/api/tickets?status=received&zone_code=B5-CTD`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const { items } = ticketListSchema.parse(await resultList.json());
    assert.equal(items.length, 1);
    assert.equal(items[0].code, ticket.code);
  } finally {
    socket.disconnect();
  }
});
test("kiểm tra đầu vào, gộp phản ánh, khẩn cấp và giới hạn tần suất", async () => {
  assert.equal(
    (await post("/api/reports", { ...report, zone_code: "X99" })).status,
    400,
  );
  assert.equal(
    (await post("/api/reports", { ...report, emergency: "yes" })).status,
    400,
  );
  assert.equal(
    (await post("/api/reports", { ...report, emergency: true })).status,
    201,
  );
  assert.equal(server.tickets.length, 1);
  assert.equal(server.tickets[0].source, "emergency");
  assert.equal(server.tickets[0].priority, "urgent");
  assert.equal((await post("/api/reports", report)).status, 201);
  assert.equal((await post("/api/reports", report)).status, 429);
});
test("cho phép origin dev/preview cục bộ, từ chối origin ngoài danh sách", async () => {
  const headers = { Origin: "http://127.0.0.1:4173", Authorization: `Bearer ${token}` };
  const response = await fetch(`${base}/api/tickets`, { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), headers.Origin);
  assert.equal((await fetch(`${base}/api/tickets`, { headers: { ...headers, Origin: "https://untrusted.example" } })).status, 403);
});

test("đăng xuất thu hồi token", async () => {
  const login = await (
    await post("/api/auth/login", { username: "catruc", password: "Demo@2026" })
  ).json();
  const headers = { Authorization: `Bearer ${login.token}` };
  assert.equal((await fetch(`${base}/api/auth/me`, { headers })).status, 200);
  await fetch(`${base}/api/auth/logout`, { method: "POST", headers });
  assert.equal((await fetch(`${base}/api/tickets`, { headers })).status, 401);
});
