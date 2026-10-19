import { z } from "zod";

/**
 * Hợp đồng dữ liệu 3: Phiếu xử lý sự cố & Quản lý quy trình 6 bước
 * 4 vai trò đăng nhập:
 * - manager: Ban quản lý
 * - guard: Ca trực
 * - analyst: Phân tích / Chuyên viên
 * - viewer: Khách / Ban Giám Khảo (chỉ xem, sandbox)
 */
export const roles = ["manager", "guard", "analyst", "viewer"] as const;
export type UserRole = (typeof roles)[number];

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});
export type User = z.infer<typeof userSchema>;

export const roleLabels: Record<UserRole, string> = {
  manager: "Ban quản lý",
  guard: "Ca trực",
  analyst: "Phân tích",
  viewer: "Khách / BGK",
};

/**
 * 6 trạng thái xử lý phiếu theo quy chuẩn SOP:
 * received -> assigned -> verifying -> handled -> responded -> closed
 */
export const statuses = [
  "received",
  "assigned",
  "verifying",
  "handled",
  "responded",
  "closed",
] as const;
export type TicketStatus = (typeof statuses)[number];

export const statusLabels: Record<TicketStatus, string> = {
  received: "Đã tiếp nhận",
  assigned: "Đã phân công",
  verifying: "Đang xác minh",
  handled: "Đã xử lý",
  responded: "Đã phản hồi",
  closed: "Đã đóng",
};

export const sourceTypes = ["sensor", "report", "both", "emergency"] as const;
export type SourceType = (typeof sourceTypes)[number];

export const sourceLabels: Record<SourceType, string> = {
  sensor: "Cảm biến",
  report: "Sinh viên",
  both: "Cả hai nguồn",
  emergency: "Khẩn cấp",
};

export const priorityLevels = ["low", "normal", "high", "urgent"] as const;
export type PriorityLevel = (typeof priorityLevels)[number];

export const priorityLabels: Record<PriorityLevel, string> = {
  low: "Thấp",
  normal: "Thông thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

/** Schema phiếu xử lý */
export const ticketSchema = z.object({
  code: z.string(),
  zone_code: z.string(),
  source: z.enum(sourceTypes),
  priority: z.enum(priorityLevels),
  status: z.enum(statuses),
  created_at: z.string(),
  updated_at: z.string(),
  due_at: z.string().nullable(),
  assignee_id: z.string().nullable(),
  presence: z.boolean().nullable(),
  /** Ghi chú phản hồi / lý do xử lý */
  feedback_note: z.string().nullable().optional(),
  /** Cờ sandbox cho tài khoản BGK (tự xoá sau 30 phút, có nút đặt lại) */
  is_sandbox: z.boolean().default(false),
  /** Cờ phản ánh từ link dùng thử Form 2 */
  is_trial: z.boolean().default(false),
  /** Đã quá hạn xử lý SLA 15 phút */
  is_overdue: z.boolean().default(false),
  /** Đã kích hoạt cảnh báo chuyển cấp cho BQL */
  escalated: z.boolean().default(false),
});
export type Ticket = z.infer<typeof ticketSchema>;
export const ticketListSchema = z.object({ items: z.array(ticketSchema) });

/** 6 loại sự kiện khói trong bộ phân loại AI (tầng 2) + unclassified */
export const eventClasses = [
  "unclassified",
  "cigarette",
  "vape",
  "steam",
  "dust",
  "spray",
  "ambient",
] as const;
export type EventClass = (typeof eventClasses)[number];

export const eventClassLabels: Record<EventClass, string> = {
  unclassified: "Nghi vấn (chưa phân loại)",
  cigarette: "Thuốc lá điếu",
  vape: "Thuốc lá điện tử",
  steam: "Hơi nước nhà tắm",
  dust: "Bụi quét dọn",
  spray: "Bình xịt",
  ambient: "Ô nhiễm ngoài trời",
};

export const eventSchema = z.object({
  event_id: z.string(),
  source: z.enum(["sensor", "report", "both"]),
  zone_code: z.string(),
  started_at: z.string(),
  ended_at: z.string().nullable(),
  class: z.enum(eventClasses),
  confidence: z.number().min(0).max(1),
  ticket_code: z.string(),
});
export type Event = z.infer<typeof eventSchema>;

/** Lịch sử chuyển trạng thái phiếu (Audit Trail) */
export const ticketHistorySchema = z.object({
  id: z.string(),
  ticket_code: z.string(),
  from_status: z.enum(statuses).nullable(),
  to_status: z.enum(statuses),
  action: z.string(),
  performed_by_id: z.string().nullable(),
  performed_by_name: z.string().optional(),
  note: z.string().nullable(),
  created_at: z.string(),
});
export type TicketHistory = z.infer<typeof ticketHistorySchema>;

/** Infographic tuyên truyền BQL đăng */
export const infographicSchema = z.object({
  id: z.string(),
  title: z.string(),
  image_url: z.string(),
  building: z.string().nullable(),
  zone_code: z.string().nullable(),
  created_by_id: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
});
export type Infographic = z.infer<typeof infographicSchema>;

export const loginSchema = z.object({
  token: z.string(),
  user: userSchema,
});
