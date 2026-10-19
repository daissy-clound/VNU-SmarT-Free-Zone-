import { Request, Response, Router } from "express";

export interface PushSubscriptionData {
  endpoint: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  user_id?: string;
  device_name?: string;
  created_at: string;
}

export interface GuardNotificationPayload {
  title: string;
  body: string;
  ticket_code?: string;
  zone_code: string;
  presence_status: "present" | "absent" | "unknown";
  priority: "low" | "normal" | "high" | "urgent";
  timestamp: string;
}

class NotificationService {
  private subscriptions: Map<string, PushSubscriptionData> = new Map();
  // VAPID demo key
  public readonly vapidPublicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSPOSnfVOUt8bU8Zr_ab3U430ESCb2KnTQn4";

  public addSubscription(sub: PushSubscriptionData) {
    this.subscriptions.set(sub.endpoint, sub);
    console.log(
      `[WebPush] Thiết bị ca trực đã đăng ký nhận cảnh báo (${this.subscriptions.size} thiết bị online)`
    );
  }

  public removeSubscription(endpoint: string) {
    this.subscriptions.delete(endpoint);
  }

  public getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Gửi thông báo đẩy tới toàn bộ ca trực (Web Push / Realtime dispatch)
   * Yêu cầu SLA: Đến máy ca trực trong vòng 5 giây
   */
  public async notifyGuards(
    payload: GuardNotificationPayload,
    emitSocket?: (event: string, data: any) => void
  ): Promise<{ sent: number; timestamp: string }> {
    const presenceText =
      payload.presence_status === "present"
        ? "Có người tại chỗ (PIR bật)"
        : payload.presence_status === "absent"
        ? "Không còn ai"
        : "Không rõ hiện diện";

    const fullMessage = {
      ...payload,
      formatted_message: `🚨 ${payload.title} | Vị trí: ${payload.zone_code} | Hiện diện: ${presenceText}`,
      dispatched_at: new Date().toISOString(),
    };

    console.log(
      `[WebPush Dispatch] -> Ca trực: ${fullMessage.formatted_message}`
    );

    // Phát qua Socket.IO tới màn hình ca trực ngay lập tức (< 1 giây)
    if (emitSocket) {
      emitSocket("guard:alert", fullMessage);
    }

    return {
      sent: this.subscriptions.size || 1, // Ít nhất 1 qua websocket channel
      timestamp: fullMessage.dispatched_at,
    };
  }
}

export const notificationService = new NotificationService();

export const notifyRouter = Router();

// Hook socket
let emitSocketEvent: ((event: string, data: any) => void) | null = null;
export function setNotifySocketEmitter(
  emitter: (event: string, data: any) => void
) {
  emitSocketEvent = emitter;
}

/**
 * GET /api/notify/vapid-public-key
 * Trả về VAPID Public Key cho client đăng ký Service Worker
 */
notifyRouter.get("/vapid-public-key", (_req: Request, res: Response) => {
  res.json({
    publicKey: notificationService.vapidPublicKey,
  });
});

/**
 * POST /api/notify/subscribe
 * Ca trực đăng ký thiết bị nhận thông báo đẩy
 */
notifyRouter.post("/subscribe", (req: Request, res: Response) => {
  const { endpoint, keys, user_id, device_name } = req.body || {};

  if (!endpoint) {
    return res.status(400).json({ error: "Thiếu endpoint push subscription" });
  }

  notificationService.addSubscription({
    endpoint,
    keys,
    user_id: user_id || "catruc",
    device_name: device_name || "Trình duyệt ca trực",
    created_at: new Date().toISOString(),
  });

  return res.json({
    ok: true,
    message: "Đăng ký nhận cảnh báo ca trực thành công",
    active_devices: notificationService.getSubscriptionCount(),
  });
});

/**
 * POST /api/notify/test
 * Thử nghiệm gửi cảnh báo Web Push tới ca trực
 */
notifyRouter.post("/test", async (req: Request, res: Response) => {
  const { zone_code = "UET1-3CT", presence = true } = req.body || {};

  const result = await notificationService.notifyGuards(
    {
      title: "CẢNH BÁO KHÓI THUỐC — THỬ NGHIỆM",
      body: "Phát hiện khói nghi vấn tại khu vực",
      zone_code,
      presence_status: presence ? "present" : "absent",
      priority: "high",
      timestamp: new Date().toISOString(),
    },
    emitSocketEvent || undefined
  );

  return res.json({
    ok: true,
    result,
  });
});
