import { z } from "zod";

/**
 * Điều phối kiểm tra: Ban quản lý (1 ban chung cho trường) nhận phiếu, xác minh thông tin,
 * rồi điều phối cho phòng trực của toà. Mỗi toà UET có một phòng trực giảng (làm giờ hành chính);
 * Nhà đa năng và các cổng do Phòng bảo vệ phụ trách (24/7).
 * Phòng trực có 3 phút để nhận; quá hạn thì Ban quản lý gọi điện (số giả lập).
 */

/** Thời gian phòng trực được nhận phiếu sau khi điều phối */
export const ACCEPT_WINDOW_SECONDS = 180;

/** Giờ hành chính (giờ Việt Nam, UTC+7) */
export const OFFICE_HOURS = {
  days: [1, 2, 3, 4, 5], // thứ 2 → thứ 6 (getUTCDay: 0 = Chủ nhật)
  start: 7 * 60 + 30,
  end: 17 * 60,
  label: "Thứ 2–6, 7:30–17:00",
} as const;

export const dutyRoomKinds = ["teaching", "security"] as const;
export type DutyRoomKind = (typeof dutyRoomKinds)[number];

export const dutyRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(dutyRoomKinds),
  /** Toà / khu vực phụ trách (mã toà trong danh mục khu vực) */
  buildings: z.array(z.string()),
  location: z.string(),
  /** Số điện thoại giả lập — chưa phải số thật của trường */
  phone: z.string(),
  hours: z.enum(["office", "24/7"]),
  staff_ids: z.array(z.string()),
});
export type DutyRoom = z.infer<typeof dutyRoomSchema>;

/** Tài khoản demo của phòng trực (mật khẩu chung Demo@2026). Tài khoản `catruc` có sẵn thuộc Phòng bảo vệ. */
export const DUTY_STAFF_ACCOUNTS = [
  { id: "usr_truc_uet1_a", username: "trucuet1", name: "Trực giảng UET1 · Cán bộ A" },
  { id: "usr_truc_uet1_b", username: "trucuet1b", name: "Trực giảng UET1 · Cán bộ B" },
  { id: "usr_truc_uet2_a", username: "trucuet2", name: "Trực giảng UET2 · Cán bộ A" },
  { id: "usr_truc_uet2_b", username: "trucuet2b", name: "Trực giảng UET2 · Cán bộ B" },
  { id: "usr_truc_uet3_a", username: "trucuet3", name: "Trực giảng UET3 · Cán bộ A" },
  { id: "usr_truc_uet3_b", username: "trucuet3b", name: "Trực giảng UET3 · Cán bộ B" },
  { id: "usr_truc_uet4_a", username: "trucuet4", name: "Trực giảng UET4 · Cán bộ A" },
  { id: "usr_truc_uet4_b", username: "trucuet4b", name: "Trực giảng UET4 · Cán bộ B" },
  { id: "usr_baove_b", username: "baove", name: "Phòng bảo vệ · Nhân viên B" },
] as const;

export const SECURITY_ROOM_ID = "PBV";

export const DUTY_ROOMS: DutyRoom[] = [
  ...[1, 2, 3, 4].map((n) => ({
    id: `PT-UET${n}`,
    name: `Phòng trực giảng UET${n}`,
    kind: "teaching" as const,
    buildings: [`UET${n}`],
    location: `Tầng 1, toà UET${n}`,
    phone: `024 0000 110${n}`,
    hours: "office" as const,
    staff_ids: [`usr_truc_uet${n}_a`, `usr_truc_uet${n}_b`],
  })),
  {
    id: SECURITY_ROOM_ID,
    name: "Phòng bảo vệ",
    kind: "security",
    buildings: ["DN", "CONG"],
    location: "Chốt bảo vệ cổng 1",
    phone: "024 0000 1100",
    hours: "24/7",
    staff_ids: ["usr_catruc", "usr_baove_b"],
  },
];

/** Giờ Việt Nam của một thời điểm: thứ trong tuần và số phút từ 0:00 */
export function vnClock(at: Date) {
  const vn = new Date(at.getTime() + 7 * 3600_000);
  return { day: vn.getUTCDay(), minutes: vn.getUTCHours() * 60 + vn.getUTCMinutes() };
}

export function isOfficeHours(at: Date = new Date()) {
  const { day, minutes } = vnClock(at);
  return (
    (OFFICE_HOURS.days as readonly number[]).includes(day) &&
    minutes >= OFFICE_HOURS.start &&
    minutes < OFFICE_HOURS.end
  );
}

export function roomOnDuty(room: DutyRoom, at: Date = new Date()) {
  return room.hours === "24/7" || isOfficeHours(at);
}

export function getRoom(id: string) {
  return DUTY_ROOMS.find((r) => r.id === id);
}

export function roomForBuilding(building: string) {
  return DUTY_ROOMS.find((r) => r.buildings.includes(building)) ?? getRoom(SECURITY_ROOM_ID)!;
}

export function roomOfUser(userId: string) {
  return DUTY_ROOMS.find((r) => r.staff_ids.includes(userId));
}

/** Phòng nên điều phối: phòng trực của toà; ngoài giờ hành chính thì chuyển Phòng bảo vệ */
export function suggestRoom(building: string, at: Date = new Date()) {
  const own = roomForBuilding(building);
  if (roomOnDuty(own, at)) return { room: own, reason: `${own.name} phụ trách toà ${building}` };
  const security = getRoom(SECURITY_ROOM_ID)!;
  return {
    room: security,
    reason: `Ngoài giờ hành chính (${OFFICE_HOURS.label}): ${own.name} không trực, đề xuất ${security.name}`,
  };
}

export const dispatchStatuses = ["waiting", "overdue", "accepted"] as const;
export type DispatchStatus = (typeof dispatchStatuses)[number];

export const dispatchStatusLabels: Record<DispatchStatus, string> = {
  waiting: "Chờ phòng trực nhận",
  overdue: "Quá 3 phút chưa nhận",
  accepted: "Đã có người nhận",
};

export const dispatchSchema = z.object({
  ticket_code: z.string(),
  room_id: z.string(),
  dispatched_at: z.string(),
  dispatched_by_name: z.string(),
  accept_deadline: z.string(),
  note: z.string().nullable(),
  status: z.enum(dispatchStatuses),
  accepted_at: z.string().nullable(),
  accepted_by_name: z.string().nullable(),
  /** Các lần Ban quản lý gọi điện cho phòng trực khi quá hạn nhận */
  calls: z.array(z.object({ at: z.string(), by_name: z.string() })),
  /** Điều phối ngoài giờ hành chính */
  outside_hours: z.boolean(),
});
export type Dispatch = z.infer<typeof dispatchSchema>;
export const dispatchListSchema = z.object({ items: z.array(dispatchSchema) });

export const roomStatusSchema = dutyRoomSchema.extend({
  on_duty: z.boolean(),
  staff: z.array(z.object({ id: z.string(), name: z.string(), active_tickets: z.number() })),
  /** Phiếu đã điều phối, chưa ai nhận */
  waiting: z.number(),
  /** Phiếu phòng này đã nhận, đang kiểm tra */
  in_progress: z.number(),
});
export type RoomStatus = z.infer<typeof roomStatusSchema>;
export const roomListSchema = z.object({
  items: z.array(roomStatusSchema),
  in_office_hours: z.boolean(),
  office_hours_label: z.string(),
  accept_window_seconds: z.number(),
});
export type RoomList = z.infer<typeof roomListSchema>;
