import { z } from "zod";

// Hợp đồng tích hợp D2 đề xuất; A xác nhận trước khi nối máy chủ chung.
export const roles = ["manager", "guard", "analyst", "viewer"] as const;
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});
export type User = z.infer<typeof userSchema>;
export const statuses = [
  "received",
  "assigned",
  "verifying",
  "handled",
  "responded",
  "closed",
] as const;
export const statusLabels: Record<(typeof statuses)[number], string> = {
  received: "Đã tiếp nhận",
  assigned: "Đã phân công",
  verifying: "Đang xác minh",
  handled: "Đã xử lý",
  responded: "Đã phản hồi",
  closed: "Đã đóng",
};
export const sourceLabels = {
  sensor: "Cảm biến",
  report: "Sinh viên",
  both: "Cả hai",
  emergency: "Khẩn cấp",
};
export const priorityLabels = {
  low: "Thấp",
  normal: "Thông thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};
export const roleLabels: Record<User["role"], string> = {
  manager: "Ban quản lý",
  guard: "Ca trực",
  analyst: "Phân tích",
  viewer: "Khách / BGK",
};
export const ticketSchema = z.object({
  code: z.string(),
  zone_code: z.string(),
  source: z.enum(["sensor", "report", "both", "emergency"]),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  status: z.enum(statuses),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
  due_at: z.iso.datetime({ offset: true }).nullable(),
  assignee_id: z.string().nullable(),
  presence: z.boolean().nullable(),
});
export type Ticket = z.infer<typeof ticketSchema>;
export const ticketListSchema = z.object({ items: z.array(ticketSchema) });
export const loginSchema = z.object({ token: z.string(), user: userSchema });
