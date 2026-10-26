import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Địa chỉ API dùng khi gửi phản ánh / bản tin thử (PW_API_URL để chạy trên cổng khác) */
export const API = process.env.PW_API_URL || "http://127.0.0.1:3001";

export async function login(page: Page, username = "bql") {
  await page.goto("/");
  await page.getByLabel("Tài khoản", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill("Demo@2026");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
}

/** Ban quản lý điều phối phiếu cho phòng trực qua API (bước bắt buộc trước khi phòng trực thấy phiếu) */
export async function dispatchTo(request: APIRequestContext, ticket_code: string, room_id: string) {
  const { token } = await (
    await request.post(`${API}/api/auth/login`, { data: { username: "bql", password: "Demo@2026" } })
  ).json();
  const res = await request.post(`${API}/api/dispatch`, {
    data: { ticket_code, room_id },
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.status()).toBe(201);
}
