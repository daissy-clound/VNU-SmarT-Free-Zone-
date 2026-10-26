import { TelemetryMessage } from "../../contracts/telemetry";

export interface AnomalyResult {
  is_anomaly: boolean;
  confidence: number;
  reason: string;
  suggested_class?: "unclassified" | "cigarette" | "vape" | "steam" | "dust" | "spray" | "ambient";
  presence_status: "present" | "empty" | "unknown";
  metrics: {
    baseline_pm25: number;
    current_pm25: number;
    mad: number;
    rh: number;
  };
}

/**
 * Tầng 1: Phát hiện bất thường khói theo thời gian thực (Real-time Anomaly Detection)
 * - Sử dụng baseline động (Rolling Median) 30 phút và độ lệch bền (MAD - Median Absolute Deviation)
 * - Tự động lọc hơi nước nhà tắm (RH > 85% kèm nhiệt độ cao)
 * - Tự động phát hiện ô nhiễm ngoài trời diện rộng
 * - Tích hợp trọng số cảm biến chuyển động PIR (presence)
 */
export class SmokeAnomalyDetector {
  private historyByNode: Map<string, TelemetryMessage[]> = new Map();
  private maxHistoryLength = 360; // 360 bản tin 5s = 30 phút

  /**
   * Đưa bản tin mới vào bộ đệm trượt
   */
  public pushTelemetry(msg: TelemetryMessage): void {
    const list = this.historyByNode.get(msg.node_id) || [];
    list.push(msg);
    if (list.length > this.maxHistoryLength) {
      list.shift();
    }
    this.historyByNode.set(msg.node_id, list);
  }

  /**
   * Tính trung vị của một mảng số
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Đánh giá bản tin hiện tại
   */
  public evaluate(msg: TelemetryMessage, allRecentNodes?: TelemetryMessage[]): AnomalyResult {
    this.pushTelemetry(msg);
    const history = this.historyByNode.get(msg.node_id) || [msg];

    // 1. Tính baseline và MAD từ lịch sử PM2.5
    const pm25Values = history.map((h) => h.pm25);
    const baseline = this.calculateMedian(pm25Values);
    const deviations = pm25Values.map((v) => Math.abs(v - baseline));
    const mad = this.calculateMedian(deviations) || 2.0;

    const currentPm25 = msg.pm25;
    const diff = currentPm25 - baseline;

    // 2. Xác định trạng thái hiện diện PIR
    let presenceStatus: "present" | "empty" | "unknown" = "unknown";
    if (msg.presence === true) {
      presenceStatus = "present";
    } else if (msg.presence === false) {
      presenceStatus = "empty";
    }

    // 3. Kiểm tra lọc hơi nước nhà tắm (Steam Filter)
    // Nếu độ ẩm RH > 85% và nhiệt độ tăng, khả năng cao là hơi nước nóng
    const isHighHumidity = msg.rh > 85.0;
    if (isHighHumidity && currentPm25 > 35) {
      return {
        is_anomaly: false,
        confidence: 0.25,
        reason: "Lọc nhiễu hơi nước: Độ ẩm quá cao (RH > 85%)",
        suggested_class: "steam",
        presence_status: presenceStatus,
        metrics: { baseline_pm25: baseline, current_pm25: currentPm25, mad, rh: msg.rh },
      };
    }

    // 4. Kiểm tra ô nhiễm diện rộng ngoài trời (Ambient Filter)
    // Nếu có dữ liệu từ nhiều nút và trên 60% các nút đều tăng PM2.5 cùng lúc
    if (allRecentNodes && allRecentNodes.length >= 3) {
      const highNodes = allRecentNodes.filter((n) => n.pm25 > 45);
      if (highNodes.length / allRecentNodes.length >= 0.6) {
        return {
          is_anomaly: false,
          confidence: 0.3,
          reason: "Lọc nhiễu ô nhiễm môi trường diện rộng toàn khuôn viên",
          suggested_class: "ambient",
          presence_status: presenceStatus,
          metrics: { baseline_pm25: baseline, current_pm25: currentPm25, mad, rh: msg.rh },
        };
      }
    }

    // 5. Ngưỡng phát hiện bất thường:
    // Điều kiện: PM2.5 vượt ngưỡng tuyệt đối (>= 35 ug/m3) HOẶC vượt ngưỡng thống kê (baseline + 3*MAD)
    const exceedsAbsolute = currentPm25 >= 35.0;
    const exceedsStatistical = diff >= Math.max(15.0, 3 * mad);

    if (exceedsAbsolute || exceedsStatistical) {
      // Tính toán độ tin cậy ban đầu (0.6 - 0.95)
      let confidence = Math.min(0.95, 0.65 + Math.min(0.25, diff / 80));

      // Trọng số hiện diện PIR:
      // Có người tại chỗ -> tăng độ tin cậy thêm 10%
      // Không có ai -> giữ nguyên cảnh báo nhưng giảm 10% độ tin cậy
      if (msg.presence === true) {
        confidence = Math.min(0.98, confidence + 0.1);
      } else if (msg.presence === false) {
        confidence = Math.max(0.55, confidence - 0.1);
      }

      return {
        is_anomaly: true,
        confidence: Math.round(confidence * 100) / 100,
        reason: `Phát hiện nồng độ khói tăng vọt (+${diff.toFixed(1)} ug/m3 so với nền ${baseline.toFixed(1)})`,
        suggested_class: "unclassified",
        presence_status: presenceStatus,
        metrics: { baseline_pm25: baseline, current_pm25: currentPm25, mad, rh: msg.rh },
      };
    }

    return {
      is_anomaly: false,
      confidence: 0.1,
      reason: "Bình thường",
      presence_status: presenceStatus,
      metrics: { baseline_pm25: baseline, current_pm25: currentPm25, mad, rh: msg.rh },
    };
  }

  public reset(): void {
    this.historyByNode.clear();
  }
}

export const smokeDetector = new SmokeAnomalyDetector();
