import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

test("tìm phiếu không dấu, giữ bộ lọc và đi từ phiếu đến đúng sơ đồ khu vực", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page
    .getByRole("link", { name: "Xem phiếu quá hạn", exact: true })
    .click();
  await expect(page).toHaveURL(/scope=overdue/);
  await expect(page.locator("tbody tr.ant-table-row").first()).toContainText(
    "Quá hạn",
  );
  await page.getByRole("button", { name: "Xoá bộ lọc", exact: true }).click();
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/tickets-ux.png",
    fullPage: true,
  });
  await page
    .getByRole("textbox", { name: "Tìm phiếu", exact: true })
    .fill("cau thang tay");
  await expect(
    page.getByRole("button", { name: "SF-DEMO-002", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SF-DEMO-001", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Tìm phiếu", exact: true }),
  ).toHaveValue("cau thang tay");
  await page.getByRole("button", { name: "SF-DEMO-002", exact: true }).click();
  await page
    .getByRole("button", { name: "Xem vị trí trên sơ đồ", exact: true })
    .click();
  await expect(page).toHaveURL(/floors\?zone=A3-CTT/);
  await expect(page.locator("#sensor-A3-CTT")).toBeVisible();
  await page
    .getByRole("button", { name: "Xem phiếu khu vực này", exact: true })
    .click();
  await expect(page).toHaveURL(/zone_code=A3-CTT/);
  await expect(
    page.getByRole("button", { name: "SF-DEMO-002", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SF-DEMO-001", exact: true }),
  ).toHaveCount(0);
});

test("phiếu trên điện thoại: thẻ dễ đọc, menu nhanh, không tràn màn hình", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page
    .getByRole("navigation", { name: "Điều hướng nhanh" })
    .getByRole("link", { name: "Phiếu", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Tìm phiếu", exact: true })
    .fill("SF-DEMO-001");
  const card = page.locator(".ticket-mobile-card");
  await expect(card).toHaveCount(1);
  await expect(card).toContainText("Nguồn: Cảm biến");
  await page
    .getByRole("button", { name: "Bộ lọc chi tiết", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Lọc theo trạng thái" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Thu gọn bộ lọc", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Lọc theo trạng thái" }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/tickets-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 740 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await card.getByRole("button", { name: "Xem phiếu SF-DEMO-001" }).click();
  await expect(
    page.getByText("Thông tin phiếu", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Điều hướng nhanh" })
    .getByRole("link", { name: "Sơ đồ tầng", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sơ đồ tầng", exact: true }),
  ).toBeVisible();
});

async function login(page: Page, username = "bql") {
  await page.goto("/");
  await page.getByLabel("Tài khoản", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
}

test("B gửi phản ánh → phiếu xuất hiện không tải lại; lọc; sơ đồ SVG; ảnh bàn giao", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expect(page.getByText("Đang cập nhật trực tiếp")).toBeVisible();
  mkdirSync("docs/assets/c-d2/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/overview.png",
    fullPage: true,
  });
  await page.getByRole("menuitem", { name: "Phiếu", exact: true }).click();
  const start = Date.now();
  const response = await request.post("http://127.0.0.1:3001/api/reports", {
    data: {
      zone_code: "B5-CTD",
      type: "smoke_now",
      ongoing: true,
      emergency: true,
      note: "B kiểm thử",
      device_token: `e2e-${Date.now()}`,
    },
  });
  expect(response.status()).toBe(201);
  const row = page.getByRole("row").filter({ hasText: "B5-CTD" });
  await expect(row).toBeVisible({ timeout: 5000 });
  await expect(row).toContainText("Khẩn cấp");
  console.log(`HTTP phản ánh → hàng phiếu trên UI: ${Date.now() - start} ms`);
  await page.getByRole("combobox", { name: "Lọc theo trạng thái" }).click();
  await page.getByText("Đã đóng", { exact: true }).last().click();
  await expect(page.getByRole("row").filter({ hasText: "B5-CTD" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Xoá bộ lọc" }).click();
  await expect(row).toBeVisible();
  await page.getByRole("combobox", { name: "Lọc theo khu vực" }).fill("B5-CTD");
  await page.getByText("B5-CTD · Cầu thang Đông", { exact: true }).click();
  await expect(page.locator("tbody tr.ant-table-row")).toHaveCount(1);
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/tickets.png",
    fullPage: true,
  });
  await row.getByRole("button").click();
  await expect(
    page.getByText("Thông tin phiếu", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("menuitem", { name: "Sơ đồ tầng", exact: true }).click();
  await expect(page.locator("#sensor-B5-CTD")).toBeVisible();
  await expect(page.locator("#QR-B5-CTD")).toBeVisible();
  await page.locator("#sensor-B5-CTD").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Cầu thang Đông" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/floor-b5.png",
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sơ đồ tầng", exact: true }),
  ).toBeVisible();
});

test("vai trò ca trực: giao diện điện thoại, chặn URL phân tích, đăng xuất", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, "catruc");
  await expect(
    page.getByRole("heading", { name: "Ca trực của tôi" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/assets/c-d2/screenshots/shift-mobile.png",
    fullPage: true,
  });
  await page.goto("/analytics");
  await expect(
    page.getByText("Không có quyền truy cập", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(
    page.getByRole("menuitem", { name: "Phân tích", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
});

test("lỗi mạng giữ dữ liệu cũ, khôi phục; token hết hạn yêu cầu đăng nhập", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("menuitem", { name: "Phiếu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "SF-DEMO-001", exact: true }),
  ).toBeVisible();
  await page.route("**/api/tickets", (route) => route.abort());
  await page.getByRole("button", { name: "Làm mới" }).click();
  await expect(
    page.getByText("Đang giữ dữ liệu lần đồng bộ trước.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "SF-DEMO-001", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/tickets");
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(
    page.getByText("Đang giữ dữ liệu lần đồng bộ trước.", { exact: false }),
  ).toHaveCount(0);
  await page.route("**/api/tickets", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"message":"expired"}',
    }),
  );
  await page.getByRole("button", { name: "Làm mới" }).click();
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."),
  ).toBeVisible();
});

for (const username of ["phantich", "bgk"]) {
  test(`${username}: menu chỉ xem và chặn đường dẫn ca trực`, async ({
    page,
  }) => {
    await login(page, username);
    await expect(
      page.getByRole("menuitem", { name: "Phân tích", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Ca trực", exact: true }),
    ).toHaveCount(0);
    await page.goto("/shift");
    await expect(
      page.getByText("Không có quyền truy cập", { exact: true }),
    ).toBeVisible();
  });
}

test("socket gián đoạn: đối soát HTTP vẫn nhận phiếu; không có kết quả lọc", async ({
  page,
  request,
}) => {
  await page.route("**/socket.io/**", (route) => route.abort());
  await login(page);
  await page.getByRole("menuitem", { name: "Phiếu", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "SF-DEMO-001", exact: true }),
  ).toBeVisible();
  const response = await request.post("http://127.0.0.1:3001/api/reports", {
    data: {
      zone_code: "B1-SANH",
      type: "smell",
      ongoing: true,
      emergency: false,
      device_token: `poll-${Date.now()}`,
    },
  });
  expect(response.status()).toBe(201);
  await expect(
    page.getByRole("row").filter({ hasText: "B1-SANH" }),
  ).toBeVisible({ timeout: 8000 });
  await page
    .getByRole("combobox", { name: "Lọc theo khu vực" })
    .fill("B1-SANH");
  await page.getByText("B1-SANH · Sảnh", { exact: true }).click();
  await page.getByRole("combobox", { name: "Lọc theo trạng thái" }).click();
  await page.getByText("Đã đóng", { exact: true }).last().click();
  await expect(page.getByText("Không có phiếu khớp bộ lọc.")).toBeVisible();
});
