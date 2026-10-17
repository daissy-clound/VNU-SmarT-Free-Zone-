import { z } from "zod";

/**
 * Hợp đồng dữ liệu 1: Bản tin cảm biến (Telemetry)
 * Topic MQTT: sfz/{site}/{nodeId}/telemetry
 * Nhịp phát trực tiếp: 5 giây/lần
 * QoS: 0 (theo chuẩn ESP32 PubSubClient) kèm số thứ tự seq để phát hiện mất gói
 */
export const telemetrySchema = z
  .object({
    /** Mã nút cảm biến (VD: B5-CTD, A2-WC) */
    node_id: z.string().min(1),
    /** Thời gian phát chuẩn ISO 8601 (VD: 2026-10-20T22:10:05+07:00) */
    ts: z.string(),
    /** Số thứ tự tăng dần để phát hiện mất gói */
    seq: z.number().int().nonnegative(),
    /** Nồng độ bụi mịn PM1.0 (ug/m3) */
    pm1: z.number().nonnegative(),
    /** Nồng độ bụi mịn PM2.5 (ug/m3) - chỉ số chính */
    pm25: z.number().nonnegative(),
    /** Nồng độ bụi PM10 (ug/m3) */
    pm10: z.number().nonnegative(),
    /** Nồng độ số hạt - number concentration (hạt/cm3) */
    nc: z.number().nonnegative(),
    /** Kích thước hạt điển hình - typical particle size (um) */
    typ_size: z.number().nonnegative(),
    /** Nhiệt độ môi trường (độ C) */
    temp: z.number(),
    /** Độ ẩm tương đối (%RH) */
    rh: z.number().min(0).max(100),
    /**
     * Cảm biến hiện diện PIR/mmWave:
     * true nếu có chuyển động trong 5 giây vừa qua; false nếu không có; null nếu nút chưa gắn PIR
     */
    presence: z.boolean().nullable().default(null),
    /** Số giây kể từ lần cuối phát hiện chuyển động (null nếu chưa gắn PIR) */
    presence_age: z.number().nonnegative().nullable().default(null),
    /** Cường độ tín hiệu Wi-Fi RSSI (dBm) */
    rssi: z.number().default(-60),
    /** Phiên bản firmware (VD: 0.3.0) */
    fw: z.string().default("0.3.0"),
    /** Đánh dấu bản tin gửi bù sau khi mất kết nối mạng */
    late: z.boolean().default(false),
  })
  .strict();

export type Telemetry = z.infer<typeof telemetrySchema>;

/**
 * Bản tin trạng thái nhịp tim (Heartbeat)
 * Topic MQTT: sfz/{site}/{nodeId}/status
 */
export const nodeStatusSchema = z
  .object({
    node_id: z.string(),
    status: z.enum(["online", "offline", "error", "calibrating"]),
    ts: z.string(),
    ip: z.string().optional(),
    fw: z.string(),
    uptime_sec: z.number().int().nonnegative().optional(),
  })
  .strict();

export type NodeStatus = z.infer<typeof nodeStatusSchema>;
