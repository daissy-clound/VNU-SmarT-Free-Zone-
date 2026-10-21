import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { API, login } from "./env";

/**
 * Mục II. BUILD của C: chi tiết phiếu + bản điện thoại 3 nút, tổng quan realtime,
 * bản đồ nhiệt, PWA nhận thông báo. Ảnh bàn giao lưu ở docs/assets/c-build/.
 */
const SHOTS = "docs/assets/c-build";
mkdirSync(SHOTS, { recursive: true });

const telemetry = (node: string, pm25: number, presence: boolean, seq: number) => ({
  node_id: node,
  ts: new Date().toISOString(),
  seq,
  pm1: pm25 * 0.7,
  pm25,
  pm10: pm25 * 1.1,
  nc: pm25 * 5,
  typ_size: 0.45,
  temp: 29,
  rh: 70,
  presence,
  presence_age: presence ? 1 : 200,
  rssi: -60,
  fw: "0.3.0",
  late: false,
});

test("tổng quan: cảm biến báo nghi vấn → cảnh báo hiện ngay, ô cảm biến đổi màu, mở thẳng phiếu", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(page.locator(".sensor-tile")).toHaveCount(10);
  await expect(page.getByText("Dữ liệu mô phỏng").first()).toBeVisible();
  for (let i = 0; i < 3; i++)
    await request.post(`${API}/api/telemetry`, { data: telemetry("DN-1WC", 12, false, 500 + i) });
  const res = await request.post(`${API}/api/telemetry`, { data: telemetry("DN-1WC", 92, true, 600) });
  const code: string = (await res.json()).ticket.code;
  const alert = page.locator(".ant-notification-notice").filter({ hasText: code });
  await expect(alert).toBeVisible({ timeout: 5000 });
  await expect(alert).toContainText("có người tại chỗ");
  await expect(page.locator(".sensor-tile.suspected").filter({ hasText: "DN-1WC" })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/tong-quan.png`, fullPage: true });
  await alert.getByRole("button", { name: "Mở phiếu" }).click();
  await expect(page).toHaveURL(new RegExp(`/tickets/${code}$`));
  await expect(page.getByText("Lịch sử xử lý", { exact: true })).toBeVisible();
  await expect(page.locator(".dust-chart svg")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/chi-tiet-phieu.png`, fullPage: true });
});

test("ca trực trên điện thoại: Đang đến → Đã đến (ghi giờ tới) → xác minh nhanh → đã xử lý", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const created = await (
    await request.post(`${API}/api/reports`, {
      data: { zone_code: "UET2-4HL", type: "smoke_now", ongoing: true, emergency: false, device_token: `c-build-${Date.now()}` },
    })
  ).json();
  const code: string = created.ticket_code;
  await login(page, "catruc");
  await expect(page.getByRole("heading", { name: "Phiếu cần xử lý" })).toBeVisible();
  await page.locator(".shift-ticket-link").filter({ hasText: code }).click();
  await expect(page).toHaveURL(new RegExp(`/tickets/${code}$`));
  const actions = page.locator(".big-actions");
  await expect(actions.getByRole("button", { name: "Đang đến" })).toBeEnabled();
  await expect(actions.getByRole("button", { name: "Đã đến" })).toBeEnabled();
  await expect(actions.getByRole("button", { name: "Báo nhầm" })).toBeEnabled();
  // Không có ô nhập tên người vi phạm
  await expect(page.getByLabel(/tên người/i)).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/ca-truc-phieu-moi.png`, fullPage: true });

  await actions.getByRole("button", { name: "Đang đến" }).click();
  await expect(actions.getByRole("button", { name: "Đang đến" })).toBeDisabled();
  const tapped = Date.now();
  await actions.getByRole("button", { name: "Đã đến" }).click();
  await expect(page.locator(".arrival-note")).toContainText("Có mặt lúc");
  await page.screenshot({ path: `${SHOTS}/ca-truc-da-den.png`, fullPage: true });

  const detail = await (await request.get(`${API}/api/tickets/${code}`)).json();
  const arrived = detail.history.find((h: { to_status: string }) => h.to_status === "verifying");
  expect(arrived, "lịch sử phải có bước tới hiện trường").toBeTruthy();
  expect(Math.abs(Date.parse(arrived.created_at) - tapped)).toBeLessThan(5000);
  expect(detail.history.map((h: { to_status: string }) => h.to_status)).toEqual(["received", "assigned", "verifying"]);

  const box = page.locator(".verify-box");
  await box.locator(".verify-row").filter({ hasText: "Còn mùi khói?" }).getByText("Có", { exact: true }).click();
  await box.locator(".verify-row").filter({ hasText: "Có tàn" }).getByText("Không", { exact: true }).click();
  await box.locator(".verify-row").filter({ hasText: "Thấy người đang hút?" }).getByText("Không rõ", { exact: true }).click();
  await box.getByRole("button", { name: "Xác nhận đã xử lý" }).click();
  await expect(page.getByText("Lịch sử xử lý", { exact: true })).toBeVisible();
  await expect(page.locator(".history-item").last()).toContainText("Còn mùi khói: Có");
  // Ca trực không có quyền phản hồi SV / đóng phiếu
  await expect(page.getByText("Phản hồi cho sinh viên")).toHaveCount(0);
  await page.screenshot({ path: `${SHOTS}/ca-truc-da-xu-ly.png`, fullPage: true });
});

test("báo nhầm: một nút đi đủ các bước, lịch sử ghi rõ", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const { ticket_code: code } = await (
    await request.post(`${API}/api/reports`, {
      data: { zone_code: "UET3-5ST", type: "smell", ongoing: false, emergency: false, device_token: `c-fa-${Date.now()}` },
    })
  ).json();
  await login(page, "catruc");
  await page.goto(`/tickets/${code}`);
  await page.locator(".big-actions").getByRole("button", { name: "Báo nhầm" }).click();
  await expect(page.getByText("Báo nhầm", { exact: true }).first()).toBeVisible();
  const detail = await (await request.get(`${API}/api/tickets/${code}`)).json();
  expect(detail.ticket.status).toBe("handled");
  expect(detail.history.at(-1).note).toMatch(/^Báo nhầm/);
});

test("chỉ hiện nút được phép: BQL phản hồi SV ở bước Đã xử lý; Phân tích không có nút", async ({ page }) => {
  await login(page, "bql");
  await page.goto("/tickets/SF-DEMO-004");
  await expect(page.getByText("Phản hồi cho sinh viên")).toBeVisible();
  await expect(page.locator(".big-actions")).toHaveCount(0);
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await login(page, "phantich");
  await page.goto("/tickets/SF-DEMO-004");
  await expect(page.getByText("Lịch sử xử lý", { exact: true })).toBeVisible();
  await expect(page.locator(".action-card")).toHaveCount(0);
});

test("bản đồ nhiệt: khu vực × giờ, tách nghi vấn / đã xác nhận, có tooltip", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.getByRole("menuitem", { name: "Bản đồ nhiệt", exact: true }).click();
  await expect(page.locator(".heatmap table")).toBeVisible();
  await expect(page.getByText("Dữ liệu mô phỏng").first()).toBeVisible();
  await expect(page.locator(".heatmap thead th.heat-hour")).toHaveCount(24);
  const cell = page.locator(".heat-cell.has-value").first();
  await cell.hover();
  await expect(page.locator(".heat-tip")).toContainText("tin báo");
  await page.screenshot({ path: `${SHOTS}/ban-do-nhiet.png`, fullPage: true });
  await page.getByText("Đã xác nhận", { exact: true }).click();
  await expect(page.getByText(/phiếu đánh dấu báo nhầm bị loại/)).toBeVisible();
});

test("PWA ca trực: manifest cài được, bấm thông báo mở thẳng phiếu", async ({ page, context, baseURL, request }) => {
  const manifest = await (await request.get(`${baseURL}/manifest.webmanifest`)).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/shift");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  expect((await request.get(`${baseURL}/sw.js`)).ok()).toBe(true);

  await context.grantPermissions(["notifications"], { origin: baseURL! });
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "catruc");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText("Nhận cảnh báo trên điện thoại")).toBeVisible();
  await expect(page.getByText("Đã cho phép thông báo")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/ca-truc-thong-bao.png`, fullPage: true });

  // Web Push từ máy chủ (giả lập qua CDP) → service worker hiện thông báo trỏ tới phiếu
  const cdp = await context.newCDPSession(page);
  await cdp.send("ServiceWorker.enable");
  const regs = await new Promise<{ registrationId: string; scopeURL: string }[]>((resolve) => {
    cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => e.registrations.length && resolve(e.registrations));
    setTimeout(() => resolve([]), 3000);
  });
  const reg = regs.find((r) => r.scopeURL.startsWith(baseURL!));
  expect(reg, "service worker đã đăng ký").toBeTruthy();
  await cdp.send("ServiceWorker.deliverPushMessage", {
    origin: baseURL!,
    registrationId: reg!.registrationId,
    data: JSON.stringify({ title: "CẢNH BÁO KHÓI THUỐC", body: "PM2.5 vượt ngưỡng", ticket_code: "SF-DEMO-003", zone_code: "UET2-3CT", presence_status: "present" }),
  });
  const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent("serviceworker"));
  await expect
    .poll(() =>
      sw.evaluate(async () => {
        const reg = (self as unknown as { registration: ServiceWorkerRegistration }).registration;
        return (await reg.getNotifications()).map((n) => n.data?.url);
      }),
    )
    .toContain("/tickets/SF-DEMO-003");

  // Bấm vào thông báo → app mở thẳng phiếu với 3 nút
  await sw.evaluate(async () => {
    const scope = self as unknown as { registration: ServiceWorkerRegistration; dispatchEvent: (e: Event) => boolean };
    const Ctor = (globalThis as unknown as { NotificationEvent: new (type: string, init: { notification: Notification }) => Event }).NotificationEvent;
    const [n] = (await scope.registration.getNotifications()).filter((x) => x.data?.ticket_code === "SF-DEMO-003");
    scope.dispatchEvent(new Ctor("notificationclick", { notification: n }));
  });
  await expect(page).toHaveURL(/\/tickets\/SF-DEMO-003$/);
  await expect(page.locator(".big-actions button")).toHaveCount(3);
});
