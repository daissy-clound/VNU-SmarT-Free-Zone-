import { defineConfig } from "@playwright/test";

/**
 * Mặc định tự chạy API (:3001) và dashboard (:5173).
 * Đặt PW_BASE_URL (+ PW_API_URL) để kiểm thử trên máy chủ đang chạy ở cổng khác.
 */
const external = process.env.PW_BASE_URL;
export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: external || "http://127.0.0.1:5173",
    // Chromium bản đầy đủ ở chế độ headless mới: hỗ trợ service worker + thông báo
    channel: "chromium",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: external
    ? undefined
    : [
        {
          command: "npm run dev:api",
          url: "http://127.0.0.1:3001/api/health",
          reuseExistingServer: !process.env.CI,
        },
        {
          command: "npm run dev:admin",
          url: "http://127.0.0.1:5173",
          reuseExistingServer: !process.env.CI,
        },
      ],
});
