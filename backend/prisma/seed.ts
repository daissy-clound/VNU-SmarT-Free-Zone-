import { DEFAULT_ZONES } from "../src/contracts/zones";
import { DUTY_STAFF_ACCOUNTS } from "../src/contracts/dispatch";

/**
 * Dữ liệu hạt giống (Seed Data) chuẩn MVP Vòng 2:
 * 1. 20 khu vực & 10 nút cảm biến KTX ĐHQGHN
 * 2. 4 tài khoản demo cho 4 vai trò (mật khẩu chung: Demo@2026)
 * 3. 6 phiếu mẫu ban đầu; có thể tắt bằng SEED_DEMO_TICKETS=false
 * 4. 1 infographic mẫu
 */

export const SEED_USERS = [
  {
    id: "usr_bql",
    username: "bql",
    password_hash: "Demo@2026",
    name: "Ban Quản lý KTX ĐHQGHN",
    role: "manager",
  },
  {
    id: "usr_catruc",
    username: "catruc",
    password_hash: "Demo@2026",
    name: "Ca trực An ninh ĐHQGHN",
    role: "guard",
  },
  {
    id: "usr_phantich",
    username: "phantich",
    password_hash: "Demo@2026",
    name: "Chuyên viên Phân tích Dữ liệu",
    role: "analyst",
  },
  {
    id: "usr_bgk",
    username: "bgk",
    password_hash: "Demo@2026",
    name: "Ban Giám khảo Vòng 2",
    role: "viewer",
  },
  // Cán bộ phòng trực giảng UET1–4 và Phòng bảo vệ (điều phối kiểm tra)
  ...DUTY_STAFF_ACCOUNTS.map((a) => ({ ...a, password_hash: "Demo@2026", role: "guard" })),
];

export const SEED_TICKETS = [
  {
    code: "SF-DEMO-001",
    zone_code: "UET1-3CT",
    source: "report",
    priority: "normal",
    status: "received",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Còn 10 phút
    assignee_id: null,
    presence: null,
    feedback_note: null,
  },
  {
    code: "SF-DEMO-002",
    zone_code: "UET1-5WC",
    source: "sensor",
    priority: "high",
    status: "assigned",
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    assignee_id: "usr_catruc",
    presence: true,
    feedback_note: null,
  },
  {
    code: "SF-DEMO-003",
    zone_code: "UET2-3CT",
    source: "both",
    priority: "urgent",
    status: "verifying",
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Quá hạn 5 phút (SLA cảnh báo đỏ)
    assignee_id: "usr_catruc",
    presence: true,
    feedback_note: "Ca trực đang tiếp cận hiện trường cầu thang toà UET2",
  },
  {
    code: "SF-DEMO-004",
    zone_code: "UET2-5WC",
    source: "emergency",
    priority: "urgent",
    status: "handled",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    assignee_id: "usr_catruc",
    presence: false,
    feedback_note: "Đã kiểm tra và nhắc nhở sinh viên rời khỏi khu vực cầu thang",
  },
  {
    code: "SF-DEMO-005",
    zone_code: "UET3-2HL",
    source: "report",
    priority: "normal",
    status: "responded",
    created_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 105 * 60 * 1000).toISOString(),
    assignee_id: "usr_catruc",
    presence: false,
    feedback_note: "Ca trực đã tuần tra và làm sạch hành lang toà UET3",
  },
  {
    code: "SF-DEMO-006",
    zone_code: "UET4-2CT",
    source: "sensor",
    priority: "low",
    status: "closed",
    created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    due_at: new Date(Date.now() - 345 * 60 * 1000).toISOString(),
    assignee_id: "usr_catruc",
    presence: false,
    feedback_note: "Sự kiện hơi nước/bình xịt, hệ thống AI đã phân loại chính xác, đóng phiếu.",
  },
];

export const SEED_INFOGRAPHICS = [
  {
    id: "info_001",
    title: "Áp phích: Không Khói Thuốc Trọn Tương Lai — VNU UET",
    image_url: "/infographics/no-smoking-poster.png",
    building: "Toàn trường",
    zone_code: "UET1-3CT",
    created_by_id: "usr_bql",
    is_active: true,
  },
];

export async function runSeed(prisma?: any) {
  console.log("Seeding VNU SmarT-Free Zone base database...");
  if (prisma) {
    // 1. Zones & Devices
    for (const z of DEFAULT_ZONES) {
      await prisma.zone.upsert({
        where: { code: z.code },
        update: z,
        create: z,
      });

      if (z.sensor_id) {
        await prisma.device.upsert({
          where: { node_id: z.sensor_id },
          update: {
            zone_code: z.code,
            fw: "0.3.0",
            status: z.sensor_state === "normal" ? "online" : "unknown",
            presence: z.presence,
          },
          create: {
            node_id: z.sensor_id,
            zone_code: z.code,
            fw: "0.3.0",
            status: "online",
            presence: z.presence,
          },
        });
      }
    }

    // 2. Users
    for (const u of SEED_USERS) {
      await prisma.user.upsert({
        where: { username: u.username },
        update: u,
        create: u,
      });
    }

    // 3. Demo tickets are enabled by default for local development.
    if (process.env.SEED_DEMO_TICKETS !== "false") {
      for (const t of SEED_TICKETS) {
        await prisma.ticket.upsert({
          where: { code: t.code },
          update: {
            ...t,
            created_at: new Date(t.created_at),
            updated_at: new Date(t.updated_at),
            due_at: t.due_at ? new Date(t.due_at) : null,
          },
          create: {
            ...t,
            created_at: new Date(t.created_at),
            updated_at: new Date(t.updated_at),
            due_at: t.due_at ? new Date(t.due_at) : null,
          },
        });
      }
    }

    // 4. Infographics
    for (const info of SEED_INFOGRAPHICS) {
      await prisma.infographic.upsert({
        where: { id: info.id },
        update: info,
        create: info,
      });
    }
  }
  console.log("Base seed completed successfully!");
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  const { PrismaClient } = await import("@prisma/client");
  const p = new PrismaClient();
  runSeed(p)
    .catch(console.error)
    .finally(() => p.$disconnect());
}
