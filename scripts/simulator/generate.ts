import fs from "node:fs";
import path from "node:path";
import { Telemetry } from "../../backend/src/contracts/telemetry";

const SENSOR_NODES = [
  { id: "UET1-3CT", zone: "UET1-3CT", building: "UET1", floor: 3 },
  { id: "UET1-4WC", zone: "UET1-4WC", building: "UET1", floor: 4 },
  { id: "UET2-2HL", zone: "UET2-2HL", building: "UET2", floor: 2 },
  { id: "UET2-4ST", zone: "UET2-4ST", building: "UET2", floor: 4 },
  { id: "UET3-2WC", zone: "UET3-2WC", building: "UET3", floor: 2 },
  { id: "UET3-5CTD", zone: "UET3-5CTD", building: "UET3", floor: 5 },
  { id: "UET4-3CT", zone: "UET4-3CT", building: "UET4", floor: 3 },
  { id: "UET4-4ST", zone: "UET4-4ST", building: "UET4", floor: 4 },
  { id: "G2-WC-F1", zone: "G2-WC-F1", building: "NhaDaNang", floor: 1 },
  { id: "G2-WC-F2", zone: "G2-WC-F2", building: "NhaDaNang", floor: 2 },
];

export interface LabeledEvent {
  event_id: string;
  node_id: string;
  start_time: string;
  end_time: string;
  class: "cigarette" | "vape" | "steam" | "dust" | "spray" | "ambient";
  peak_pm25: number;
  duration_seconds: number;
}

/**
 * Sinh bộ dữ liệu 6 tuần chuẩn (5s/bản tin) cho 10 cảm biến
 * Phân chia theo cam kết:
 * - Tuần 1 - 4: Dùng để chỉnh ngưỡng và huấn luyện
 * - Tuần 5 - 6: Dùng độc lập để đánh giá (Test Set)
 */
export function generateDataset(weeks: number = 6) {
  const outputDir = path.resolve(process.cwd(), "scripts/simulator/data");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const events: LabeledEvent[] = [];
  const telemetrySummary: { node_id: string; total_records: number; events_count: number }[] = [];

  const now = new Date();
  const totalDays = weeks * 7;
  const startDate = new Date(now.getTime() - totalDays * 24 * 60 * 60 * 1000);

  console.log(`[Simulator] Bắt đầu sinh ${weeks} tuần dữ liệu cho 10 cảm biến...`);
  console.log(`[Simulator] Từ ${startDate.toISOString()} đến ${now.toISOString()}`);

  let eventCounter = 1;

  for (const node of SENSOR_NODES) {
    let nodeEventsCount = 0;
    // Mỗi node sinh trung bình 3-6 sự kiện mỗi tuần
    const nodeEventTotal = Math.floor(weeks * (3.5 + Math.random() * 2));

    for (let e = 0; e < nodeEventTotal; e++) {
      const dayOffset = Math.floor(Math.random() * totalDays);
      // Giờ cao điểm trưa hoặc tối
      const isNightPeak = Math.random() > 0.4;
      const hour = isNightPeak
        ? 21 + Math.floor(Math.random() * 3) // 21h - 23h
        : 11 + Math.floor(Math.random() * 3); // 11h - 13h
      const minute = Math.floor(Math.random() * 60);

      const eventStart = new Date(startDate.getTime() + (dayOffset * 24 * 3600 + hour * 3600 + minute * 60) * 1000);

      // Phân bổ 6 loại sự kiện:
      // cigarette 50%, vape 30%, steam 10%, dust 5%, spray 3%, ambient 2%
      const r = Math.random();
      let eventClass: LabeledEvent["class"] = "cigarette";
      let durationSec = 900; // 15 phút
      let peakPm = 65.0;

      if (r < 0.5) {
        eventClass = "cigarette";
        durationSec = 600 + Math.floor(Math.random() * 600); // 10 - 20 phút
        peakPm = 55 + Math.random() * 40;
      } else if (r < 0.8) {
        eventClass = "vape";
        durationSec = 90 + Math.floor(Math.random() * 120); // 1.5 - 3.5 phút
        peakPm = 75 + Math.random() * 60;
      } else if (r < 0.9) {
        eventClass = "steam";
        durationSec = 900 + Math.floor(Math.random() * 600);
        peakPm = 40 + Math.random() * 25;
      } else if (r < 0.95) {
        eventClass = "dust";
        durationSec = 300 + Math.floor(Math.random() * 300);
        peakPm = 45 + Math.random() * 20;
      } else {
        eventClass = "spray";
        durationSec = 30 + Math.floor(Math.random() * 30);
        peakPm = 80 + Math.random() * 50;
      }

      const eventEnd = new Date(eventStart.getTime() + durationSec * 1000);

      events.push({
        event_id: `ev_${eventCounter++}`,
        node_id: node.id,
        start_time: eventStart.toISOString(),
        end_time: eventEnd.toISOString(),
        class: eventClass,
        peak_pm25: Math.round(peakPm * 10) / 10,
        duration_seconds: durationSec,
      });

      nodeEventsCount++;
    }

    telemetrySummary.push({
      node_id: node.id,
      total_records: totalDays * 24 * 60 * 12, // 5s/bản tin = 12 bản tin/phút
      events_count: nodeEventsCount,
    });
  }

  // Sắp xếp sự kiện theo thời gian
  events.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Lưu file nhãn sự kiện
  const labelsFile = path.join(outputDir, "labeled_events_6weeks.json");
  fs.writeFileSync(labelsFile, JSON.stringify(events, null, 2), "utf-8");

  // Lưu file tóm tắt
  const summaryFile = path.join(outputDir, "dataset_summary.json");
  const summaryData = {
    generated_at: new Date().toISOString(),
    weeks,
    total_nodes: SENSOR_NODES.length,
    total_events: events.length,
    events_by_class: {
      cigarette: events.filter((e) => e.class === "cigarette").length,
      vape: events.filter((e) => e.class === "vape").length,
      steam: events.filter((e) => e.class === "steam").length,
      dust: events.filter((e) => e.class === "dust").length,
      spray: events.filter((e) => e.class === "spray").length,
      ambient: events.filter((e) => e.class === "ambient").length,
    },
    training_set_events: events.filter(
      (e) => new Date(e.start_time).getTime() < startDate.getTime() + 4 * 7 * 24 * 3600 * 1000
    ).length,
    test_set_events: events.filter(
      (e) => new Date(e.start_time).getTime() >= startDate.getTime() + 4 * 7 * 24 * 3600 * 1000
    ).length,
    nodes_summary: telemetrySummary,
  };
  fs.writeFileSync(summaryFile, JSON.stringify(summaryData, null, 2), "utf-8");

  console.log(`[Simulator] Đã sinh thành công ${events.length} sự kiện có nhãn:`);
  console.log(`- Tập huấn luyện (Tuần 1–4): ${summaryData.training_set_events} sự kiện`);
  console.log(`- Tập kiểm tra (Tuần 5–6): ${summaryData.test_set_events} sự kiện`);
  console.log(`- File nhãn: ${labelsFile}`);
  console.log(`- File tóm tắt: ${summaryFile}`);

  return summaryData;
}

// Chạy trực tiếp khi gọi script
if (process.argv[1] && process.argv[1].endsWith("generate.ts")) {
  generateDataset(6);
}
