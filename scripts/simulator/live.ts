import { Telemetry } from "../../backend/src/contracts/telemetry";
import { DEFAULT_ZONES } from "../../backend/src/contracts/zones";

const rawUrl = process.env.SFZ_API_URL || process.env.API_URL || "http://127.0.0.1:3001";
const API_ENDPOINT = rawUrl.endsWith("/api/telemetry")
  ? rawUrl
  : `${rawUrl.replace(/\/$/, "")}/api/telemetry`;

/** 10 nút cảm biến theo danh mục khu vực dùng chung (backend/src/contracts/zones.ts) */
const SENSOR_NODES = DEFAULT_ZONES.flatMap((zone) => (zone.sensor_id ? [zone.sensor_id] : []));

let sequenceNumber = 1000;

export function generateLivePacket(nodeId: string, isSmoke: boolean = false): Telemetry {
  sequenceNumber++;
  const basePm25 = isSmoke ? 68.0 + Math.random() * 35.0 : 8.0 + Math.random() * 8.0;
  const pm1 = basePm25 * (isSmoke ? 0.72 : 0.5);
  const pm10 = basePm25 * 1.15;

  return {
    node_id: nodeId,
    ts: new Date().toISOString(),
    seq: sequenceNumber,
    pm1: Math.round(pm1 * 10) / 10,
    pm25: Math.round(basePm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    nc: Math.round(basePm25 * (isSmoke ? 12.5 : 4.0)),
    typ_size: isSmoke ? 0.42 : 0.52,
    temp: Math.round((27.5 + Math.random() * 2) * 10) / 10,
    rh: Math.round((64.0 + Math.random() * 8) * 10) / 10,
    presence: isSmoke ? true : Math.random() > 0.85,
    presence_age: isSmoke ? 2 : Math.floor(Math.random() * 180),
    rssi: -55 - Math.floor(Math.random() * 15),
    fw: "0.3.0",
    late: false,
  };
}

export async function sendTelemetry(packet: Telemetry) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packet),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: data.status, ticket: data.ticket };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

async function startLiveSimulator() {
  console.log(`[Live Simulator] Đang kết nối tới ${API_ENDPOINT}`);
  console.log(`[Live Simulator] Bắt đầu phát dữ liệu chu kỳ 5 giây cho 10 cảm biến...`);

  let cycle = 0;
  setInterval(async () => {
    cycle++;
    // Cứ mỗi 12 chu kỳ (~60s), tạo 1 đợt khói ngẫu nhiên tại 1 điểm nóng
    const triggerSmoke = cycle % 12 === 0;
    // Lần lượt đổi điểm nóng để dashboard có nhiều khu vực nghi vấn
    const smokeNode = SENSOR_NODES[Math.floor(cycle / 12) % SENSOR_NODES.length];

    for (const nodeId of SENSOR_NODES) {
      const isSmoke = triggerSmoke && nodeId === smokeNode;
      const packet = generateLivePacket(nodeId, isSmoke);
      const res = await sendTelemetry(packet);

      if (isSmoke) {
        console.log(`🚨 [Live Event] Kích hoạt khói tại ${nodeId}: PM2.5=${packet.pm25} -> Trạng thái: ${res.status}`);
      }
    }
  }, 5000);
}

if (process.argv[1] && process.argv[1].endsWith("live.ts")) {
  void startLiveSimulator();
}
