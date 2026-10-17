import type { Ticket, User, Zone } from "../../backend/src/contracts/index";

// Toạ độ minh hoạ của C trong viewBox 1000 × 560, CHƯA được A xác nhận.
// Cảm biến đúng mục 4; 10 vị trí QR bổ sung là đề xuất để duyệt wireframe.
export const zones: Zone[] = (["A", "B"] as const).flatMap((building) =>
  [
    {
      floor: 2,
      suffix: "WC",
      name: "Khu rửa tay chung",
      x: 270,
      y: 160,
      sensor: true,
    },
    {
      floor: 3,
      suffix: "CTT",
      name: "Cầu thang Tây",
      x: 105,
      y: 280,
      sensor: true,
    },
    {
      floor: 4,
      suffix: "HL",
      name: "Cuối hành lang",
      x: 740,
      y: 280,
      sensor: true,
    },
    {
      floor: 5,
      suffix: "CTD",
      name: "Cầu thang Đông",
      x: 870,
      y: 280,
      sensor: true,
    },
    {
      floor: 6,
      suffix: "ST",
      name: "Lối lên sân thượng",
      x: 750,
      y: 160,
      sensor: true,
    },
    { floor: 1, suffix: "SANH", name: "Sảnh", x: 500, y: 280, sensor: false },
    { floor: 1, suffix: "NX", name: "Nhà xe", x: 270, y: 400, sensor: false },
    { floor: 1, suffix: "CT", name: "Căng-tin", x: 750, y: 400, sensor: false },
    {
      floor: 3,
      suffix: "HLG",
      name: "Hành lang giữa",
      x: 500,
      y: 280,
      sensor: false,
    },
    {
      floor: 5,
      suffix: "HLG",
      name: "Hành lang giữa",
      x: 500,
      y: 280,
      sensor: false,
    },
  ].map((item) => {
    const code = `${building}${item.floor}-${item.suffix}`;
    return {
      code,
      building,
      floor: item.floor,
      name: item.name,
      x: item.x,
      y: item.y,
      sensor_id: item.sensor ? code : null,
      qr_id: `QR-${code}`,
      sensor_state: "unknown" as const,
      presence: null,
    };
  }),
);

export const accounts: (User & { username: string })[] = [
  {
    id: "u-manager",
    username: "bql",
    name: "Ban quản lý KTX",
    role: "manager",
  },
  { id: "u-guard", username: "catruc", name: "Ca trực demo", role: "guard" },
  {
    id: "u-analyst",
    username: "phantich",
    name: "Nhóm phân tích",
    role: "analyst",
  },
  { id: "u-viewer", username: "bgk", name: "Khách tham quan", role: "viewer" },
];

export function seedTickets(): Ticket[] {
  const now = Date.now();
  const states = [
    "received",
    "assigned",
    "verifying",
    "handled",
    "responded",
    "closed",
  ] as const;
  const sources = [
    "sensor",
    "report",
    "both",
    "emergency",
    "report",
    "sensor",
  ] as const;
  return states.map((status, index) => ({
    code: `SF-DEMO-${String(index + 1).padStart(3, "0")}`,
    zone_code: zones[index].code,
    source: sources[index],
    priority: index === 3 ? "urgent" : index === 2 ? "high" : "normal",
    status,
    created_at: new Date(now - (index + 1) * 60000).toISOString(),
    updated_at: new Date(now).toISOString(),
    due_at:
      index < 3
        ? new Date(now + (index === 2 ? -2 : 15) * 60000).toISOString()
        : null,
    assignee_id: index ? "u-guard" : null,
    presence: null,
  }));
}
