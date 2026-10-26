/**
 * Kịch bản giả lập Sensor IoT (Nhiệm vụ Thành viên D - Đức)
 * Dự án: VNU SmarT-Free Zone — Hệ thống giám sát và cảnh báo khói thuốc thời gian thực
 * 
 * Hướng dẫn chạy:
 *   npx ts-node scripts/simulate-duc-sensor.ts
 * Hoặc:
 *   npx ts-node scripts/simulator/live.ts
 */

import { generateLivePacket, sendTelemetry } from "./simulator/live";

const TARGET_NODES = [
  "UET1-3CT", // Cầu thang Bộ Tầng 3 UET1 (Điểm nóng)
  "UET1-5WC", // WC Tầng 5 UET1
  "UET2-3CT", // Cầu thang Toà UET2
  "UET3-2HL", // Hành lang Tầng 2 UET3
];

async function main() {
  console.log("==================================================================");
  console.log("🚀 VNU SmarT-Free Zone — Trình giả lập dữ liệu Sensor IoT (Đức D)");
  console.log("📡 Mục tiêu: ĐHQGHN Hoà Lạc (Toà UET1, UET2, UET3)");
  console.log("⏱ Tần suất phát gói tin: 3 giây / lần");
  console.log("==================================================================\n");

  let tick = 0;
  setInterval(async () => {
    tick++;
    const node = TARGET_NODES[tick % TARGET_NODES.length];
    // Mỗi 6 chu kỳ tạo 1 đợt khói mô phỏng để kiểm tra cảnh báo tức thời
    const isSmoke = tick % 6 === 0;

    const packet = generateLivePacket(node, isSmoke);
    const result = await sendTelemetry(packet);

    const timestamp = new Date().toLocaleTimeString("vi-VN");
    if (isSmoke) {
      console.log(
        `🚨 [${timestamp}] [CẢNH BÁO KHÓI] Node ${packet.node_id} | PM2.5: ${packet.pm25} µg/m³ | NC: ${packet.nc} | PIR: ${packet.presence ? "CÓ NGƯỜI" : "TRỐNG"} => Kết quả: ${result.status} (Phiếu: ${result.ticket || "N/A"})`
      );
    } else {
      console.log(
        `🍃 [${timestamp}] [BÌNH THƯỜNG] Node ${packet.node_id} | PM2.5: ${packet.pm25} µg/m³ | T: ${packet.temp}°C | RH: ${packet.rh}% => ${result.status}`
      );
    }
  }, 3000);
}

main().catch(console.error);
