import { api } from "./api";

/**
 * Màn hình ca trực dạng PWA: cài lên điện thoại, nhận thông báo, bấm là mở thẳng phiếu.
 *
 * Hai đường thông báo:
 * 1. Web Push (máy chủ gửi qua dịch vụ push của trình duyệt) — hoạt động cả khi app đã đóng.
 *    Cần A gửi thật bằng khoá VAPID riêng; sw.ts đã sẵn sàng nhận.
 * 2. Cảnh báo realtime qua Socket.IO (ticket:created, guard:alert) — app đang mở hoặc chạy nền
 *    thì hiện thông báo hệ thống qua service worker, bấm vào cũng mở thẳng phiếu.
 */

export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const notificationsSupported = () =>
  "Notification" in window && "serviceWorker" in navigator;

export const pushSupported = () =>
  notificationsSupported() && "PushManager" in window;

export function permission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

let registration: Promise<ServiceWorkerRegistration | null> | null = null;
let openHandler: ((url: string) => void) | null = null;

/** Gọi một lần khi khởi động app */
export function registerServiceWorker() {
  if (registration || !("serviceWorker" in navigator)) return registration;
  registration = navigator.serviceWorker
    .register("/sw.js", { scope: "/" })
    .catch(() => null);
  navigator.serviceWorker.addEventListener("message", (event) => {
    const msg = event.data || {};
    if (msg.type === "sfz-open" && typeof msg.url === "string") openHandler?.(msg.url);
    if (msg.type === "sfz-push" && msg.ticket_code)
      logAlert({ ticket_code: msg.ticket_code, channel: "webpush", dispatched_at: msg.dispatched_at ?? null, received_at: msg.received_at });
  });
  return registration;
}

/** App đăng ký cách điều hướng khi người dùng bấm thông báo lúc cửa sổ đang mở */
export function onOpenFromNotification(handler: (url: string) => void) {
  openHandler = handler;
}

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export interface EnableResult {
  permission: NotificationPermission | "unsupported";
  /** Đã đăng ký Web Push với trình duyệt và gửi lên máy chủ */
  subscribed: boolean;
  message: string;
}

/** Xin quyền thông báo, đăng ký Web Push và gửi đăng ký cho máy chủ của A */
export async function enableNotifications(token: string, userId: string): Promise<EnableResult> {
  if (!notificationsSupported())
    return {
      permission: "unsupported",
      subscribed: false,
      message: isIOS() && !isStandalone()
        ? "Trên iPhone, hãy thêm trang vào Màn hình chính rồi mở từ biểu tượng để bật thông báo."
        : "Trình duyệt này không hỗ trợ thông báo.",
    };
  const result = await Notification.requestPermission();
  if (result !== "granted")
    return { permission: result, subscribed: false, message: "Bạn chưa cho phép thông báo. Có thể bật lại trong cài đặt trình duyệt." };
  const reg = await (registerServiceWorker() ?? Promise.resolve(null));
  if (!reg || !pushSupported())
    return { permission: result, subscribed: false, message: "Đã bật thông báo khi app đang mở. Trình duyệt này chưa hỗ trợ Web Push." };
  try {
    const key = await api.vapidKey();
    let sub = await reg.pushManager.getSubscription();
    sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
    const json = sub.toJSON();
    await api.subscribePush(token, {
      endpoint: sub.endpoint,
      keys: json.keys,
      user_id: userId,
      device_name: `${isIOS() ? "iPhone" : /Android/.test(navigator.userAgent) ? "Android" : "Máy tính"}${isStandalone() ? " (app)" : ""}`,
    });
    return { permission: result, subscribed: true, message: "Đã bật thông báo trên máy này." };
  } catch {
    return { permission: result, subscribed: false, message: "Đã bật thông báo khi app đang mở; chưa đăng ký được Web Push với máy chủ." };
  }
}

export interface AlertInput {
  ticket_code: string;
  title: string;
  body: string;
  dispatched_at: string | null;
}

/** Hiện thông báo hệ thống (bấm → mở phiếu). Trả false nếu chưa được phép. */
export async function showAlertNotification(alert: AlertInput) {
  if (permission() !== "granted") return false;
  const reg = await (registerServiceWorker() ?? Promise.resolve(null));
  if (!reg) return false;
  await reg.showNotification(alert.title, {
    body: alert.body,
    tag: alert.ticket_code || "sfz-test",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    requireInteraction: true,
    data: {
      url: alert.ticket_code ? `/tickets/${encodeURIComponent(alert.ticket_code)}` : "/shift",
      ticket_code: alert.ticket_code,
    },
  });
  return true;
}

// ---------- Nhật ký thời điểm nhận cảnh báo (bàn giao D đo độ trễ) ----------
export interface AlertLogItem {
  ticket_code: string;
  channel: "socket" | "webpush";
  dispatched_at: string | null;
  received_at: string;
  latency_ms: number | null;
}

const LOG_KEY = "sfz-alert-log";

export function getAlertLog(): AlertLogItem[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function logAlert(item: Omit<AlertLogItem, "latency_ms">) {
  const latency = item.dispatched_at ? Date.parse(item.received_at) - Date.parse(item.dispatched_at) : null;
  const next = [{ ...item, latency_ms: Number.isFinite(latency) ? latency : null }, ...getAlertLog()].slice(0, 300);
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* bộ nhớ đầy: bỏ qua */
  }
  window.dispatchEvent(new Event("sfz-alert-log"));
}

export function clearAlertLog() {
  localStorage.removeItem(LOG_KEY);
  window.dispatchEvent(new Event("sfz-alert-log"));
}

export function alertLogCsv(items = getAlertLog()) {
  const rows = [["ticket_code", "channel", "dispatched_at", "received_at", "latency_ms"]];
  for (const i of items) rows.push([i.ticket_code, i.channel, i.dispatched_at ?? "", i.received_at, i.latency_ms?.toString() ?? ""]);
  return rows.map((r) => r.join(",")).join("\n");
}

// ---------- Cài app (Android/Chrome) ----------
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let installEvent: InstallPromptEvent | null = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installEvent = e as InstallPromptEvent;
  window.dispatchEvent(new Event("sfz-installable"));
});

export const canInstall = () => !!installEvent;

export async function promptInstall() {
  if (!installEvent) return false;
  await installEvent.prompt();
  const { outcome } = await installEvent.userChoice;
  installEvent = null;
  return outcome === "accepted";
}
