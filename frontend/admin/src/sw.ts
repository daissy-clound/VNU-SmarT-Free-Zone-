
/**
 * Service worker màn hình ca trực (PWA).
 * - "push": nhận Web Push từ máy chủ (khi A gửi thật), hiện thông báo.
 * - "notificationclick": bấm thông báo → mở thẳng trang phiếu /tickets/<mã>.
 * Không import gì để Vite dựng thành một file /sw.js độc lập.
 */
declare const self: ServiceWorkerGlobalScope;
export {};

interface AlertData {
  title?: string;
  body?: string;
  formatted_message?: string;
  ticket_code?: string;
  zone_code?: string;
  presence_status?: "present" | "absent" | "unknown";
  dispatched_at?: string;
  timestamp?: string;
}

const presenceText = {
  present: "Có người tại chỗ",
  absent: "Không còn ai",
  unknown: "Không rõ",
} as const;

self.addEventListener("install", () => void self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  const receivedAt = new Date().toISOString();
  let data: AlertData = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = { body: event.data?.text() };
  }
  const code = data.ticket_code;
  const presence = data.presence_status ? presenceText[data.presence_status] : "";
  const body = [data.zone_code, presence, data.body].filter(Boolean).join(" · ");
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || "Cảnh báo khói thuốc", {
        body: body || data.formatted_message || "Có phiếu mới cần xử lý",
        tag: code || "sfz-alert",
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-96.png",
        requireInteraction: true,
        data: {
          url: code ? `/tickets/${encodeURIComponent(code)}` : "/shift",
          ticket_code: code,
          dispatched_at: data.dispatched_at || data.timestamp,
          received_at: receivedAt,
        },
      });
      // Báo cho cửa sổ đang mở để ghi nhật ký thời điểm nhận (cho D đo độ trễ)
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of windows)
        w.postMessage({ type: "sfz-push", ticket_code: code, dispatched_at: data.dispatched_at || data.timestamp, received_at: receivedAt });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url: string = event.notification.data?.url || "/shift";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const same = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (same) {
        // Cửa sổ đang mở: nhờ app điều hướng (giữ phiên đăng nhập), rồi đưa lên trước
        same.postMessage({ type: "sfz-open", url });
        await same.focus().catch(() => undefined);
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});
