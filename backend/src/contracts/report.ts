import { z } from "zod";

/**
 * Hợp đồng dữ liệu 2: Phản ánh của Sinh viên (Student Report)
 * Endpoint: POST /api/reports
 * Trả về: mã tra cứu ngẫu nhiên (VD: K7Q2-9XMA), tách hoàn toàn khỏi mã phiếu nội bộ
 * Nguyên tắc riêng tư: Không thu thập tên, SĐT, email; ghi chú được che tự động bằng regex.
 */
export const reportTypes = ["smoke_now", "smell", "vape", "butts", "other"] as const;
export type ReportType = (typeof reportTypes)[number];

export const reportTypeLabels: Record<ReportType, string> = {
  smoke_now: "Đang có người hút",
  smell: "Có mùi khói thuốc",
  vape: "Hút thuốc lá điện tử",
  butts: "Nhiều tàn thuốc",
  other: "Khác",
};

export const reportSchema = z
  .object({
    /** Mã khu vực quét từ mã QR (VD: B5-CTD) */
    zone_code: z.string().min(1),
    /** Loại phản ánh */
    type: z.enum(reportTypes),
    /** Hành vi đang tiếp diễn tại chỗ */
    ongoing: z.boolean().default(false),
    /** Bật cờ khẩn cấp (qua nút Khẩn cấp riêng) */
    emergency: z.boolean().default(false),
    /** Ghi chú mô tả thêm từ SV (tối đa 1000 ký tự) */
    note: z.string().max(1000).default(""),
    /** Token ẩn danh của thiết bị để chống spam (tối thiểu 4 ký tự) */
    device_token: z.string().min(4).max(128),
    /** Nguồn phát sinh phản ánh: app quét QR hay link dùng thử Form 2 */
    source: z.enum(["qr_app", "form2_trial", "other"]).default("qr_app"),
    /** Đánh dấu riêng phản ánh từ link dùng thử (Form 2) không tính vào số liệu vận hành */
    is_trial: z.boolean().default(false),
  })
  .strict();

export type ReportInput = z.infer<typeof reportSchema>;

/** Phản hồi sau khi tiếp nhận phản ánh */
export const reportResponseSchema = z.object({
  /** Mã tra cứu ngẫu nhiên cấp cho SV (VD: K7Q2-9XMA) */
  tracking_code: z.string(),
  /** Trạng thái tiếp nhận ban đầu */
  status: z.enum([
    "received",
    "assigned",
    "verifying",
    "handled",
    "responded",
    "closed",
  ]),
  /** Thông điệp thông báo cho sinh viên */
  message: z.string().optional(),
  /** Mã phiếu nội bộ (dành cho debug / liên kết hệ thống) */
  ticket_code: z.string().optional(),
});

export type ReportResponse = z.infer<typeof reportResponseSchema>;

/** Kết quả tra cứu tiến độ phản ánh qua mã tra cứu */
export const reportTrackingSchema = z.object({
  tracking_code: z.string(),
  zone_code: z.string(),
  zone_name: z.string(),
  building: z.string(),
  floor: z.number(),
  type: z.enum(reportTypes),
  type_label: z.string(),
  status: z.enum([
    "received",
    "assigned",
    "verifying",
    "handled",
    "responded",
    "closed",
  ]),
  status_label: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  feedback: z.string().nullable(),
});

export type ReportTracking = z.infer<typeof reportTrackingSchema>;
