import { Telemetry } from "../../contracts/telemetry";

export interface SmokeEventFeatures {
  duration_seconds: number;
  peak_pm25: number;
  rise_rate_pm25_per_sec: number;
  fall_time_seconds: number;
  pm1_pm25_ratio: number;
  typical_size_um: number;
  max_nc: number;
  rh_delta: number;
  presence_ratio: number; // 0.0 - 1.0
}

export type EventClass =
  | "cigarette"
  | "vape"
  | "steam"
  | "dust"
  | "spray"
  | "ambient"
  | "unclassified";

export interface ClassificationResult {
  event_class: EventClass;
  confidence: number;
  probabilities: Record<EventClass, number>;
  explanation: string;
  features: SmokeEventFeatures;
}

/**
 * Tầng 2: Phân loại sự kiện khói (Event Classification)
 * Sử dụng bộ suy diễn quy tắc kết hợp cây quyết định (Decision Tree / Random Forest inference)
 * dựa trên các đặc trưng vật lý - khí dung được đo bởi cảm biến quang học SPS30 và PIR.
 */
export class SmokeEventClassifier {
  /**
   * Trích xuất vector đặc trưng từ chuỗi bản tin telemetry trong đợt khói
   */
  public extractFeatures(telemetries: Telemetry[]): SmokeEventFeatures {
    if (telemetries.length === 0) {
      return {
        duration_seconds: 0,
        peak_pm25: 0,
        rise_rate_pm25_per_sec: 0,
        fall_time_seconds: 0,
        pm1_pm25_ratio: 0.5,
        typical_size_um: 0.5,
        max_nc: 0,
        rh_delta: 0,
        presence_ratio: 0,
      };
    }

    const first = telemetries[0];
    const last = telemetries[telemetries.length - 1];
    const duration = Math.max(5, (new Date(last.ts).getTime() - new Date(first.ts).getTime()) / 1000);

    let peakPm25 = -Infinity;
    let peakIndex = 0;
    let maxNc = 0;
    let sumTypicalSize = 0;
    let sumPm1Pm25Ratio = 0;
    let presenceCount = 0;

    const initialRh = first.rh;
    let maxRh = first.rh;

    for (let i = 0; i < telemetries.length; i++) {
      const t = telemetries[i];
      if (t.pm25 > peakPm25) {
        peakPm25 = t.pm25;
        peakIndex = i;
      }
      if (t.nc > maxNc) maxNc = t.nc;
      if (t.rh > maxRh) maxRh = t.rh;

      sumTypicalSize += t.typ_size || 0.5;
      const ratio = t.pm25 > 0 ? (t.pm1 || 0) / t.pm25 : 0.5;
      sumPm1Pm25Ratio += ratio;

      if (t.presence === true) {
        presenceCount++;
      }
    }

    const avgTypicalSize = sumTypicalSize / telemetries.length;
    const avgRatio = sumPm1Pm25Ratio / telemetries.length;
    const presenceRatio = presenceCount / telemetries.length;

    // Thời gian tăng lên đỉnh (rise time)
    const timeToPeakSeconds = Math.max(
      1,
      (new Date(telemetries[peakIndex].ts).getTime() - new Date(first.ts).getTime()) / 1000
    );
    const riseRate = (peakPm25 - first.pm25) / timeToPeakSeconds;

    // Thời gian giảm từ đỉnh tới kết thúc (fall time)
    const fallTimeSeconds = Math.max(
      1,
      (new Date(last.ts).getTime() - new Date(telemetries[peakIndex].ts).getTime()) / 1000
    );

    return {
      duration_seconds: Math.round(duration),
      peak_pm25: Math.round(peakPm25 * 10) / 10,
      rise_rate_pm25_per_sec: Math.round(riseRate * 100) / 100,
      fall_time_seconds: Math.round(fallTimeSeconds),
      pm1_pm25_ratio: Math.round(avgRatio * 100) / 100,
      typical_size_um: Math.round(avgTypicalSize * 100) / 100,
      max_nc: Math.round(maxNc),
      rh_delta: Math.round((maxRh - initialRh) * 10) / 10,
      presence_ratio: Math.round(presenceRatio * 100) / 100,
    };
  }

  /**
   * Phân loại sự kiện dựa trên vector đặc trưng
   */
  public classify(telemetries: Telemetry[]): ClassificationResult {
    const feat = this.extractFeatures(telemetries);

    const probs: Record<EventClass, number> = {
      cigarette: 0.05,
      vape: 0.05,
      steam: 0.05,
      dust: 0.05,
      spray: 0.05,
      ambient: 0.05,
      unclassified: 0.02,
    };

    // 1. Kiểm tra Hơi nước (Steam): Độ ẩm tăng mạnh (delta >= 15% hoặc max RH >= 85%)
    if (feat.rh_delta >= 15.0 || telemetries.some((t) => t.rh >= 88.0)) {
      probs.steam += 0.75;
      return {
        event_class: "steam",
        confidence: Math.min(0.95, probs.steam),
        probabilities: probs,
        explanation: `Độ ẩm biến thiên mạnh (+${feat.rh_delta}% RH), nồng độ hạt mịn tăng kèm hơi nước ngưng tụ.`,
        features: feat,
      };
    }

    // 2. Kiểm tra Bụi quét dọn (Dust): Kích thước hạt điển hình to (> 0.9 um), tỷ lệ PM1/PM2.5 thấp (< 0.45)
    if (feat.typical_size_um >= 0.85 || feat.pm1_pm25_ratio <= 0.42) {
      probs.dust += 0.75;
      return {
        event_class: "dust",
        confidence: Math.min(0.92, probs.dust),
        probabilities: probs,
        explanation: `Kích thước hạt điển hình lớn (${feat.typical_size_um} µm > 0.85 µm), quang phổ hạt nghiêng về bụi thô cơ học.`,
        features: feat,
      };
    }

    // 3. Kiểm tra Bình xịt khử mùi (Spray): Thời gian cực ngắn (10s - 60s), 1 xung đột biến tắt ngay
    if (feat.duration_seconds <= 65 && feat.fall_time_seconds <= 40) {
      probs.spray += 0.7;
      return {
        event_class: "spray",
        confidence: Math.min(0.88, probs.spray),
        probabilities: probs,
        explanation: `Xung khói tồn tại chớp nhoáng (${feat.duration_seconds}s), phù hợp đặc trưng hạt khí dung bình xịt.`,
        features: feat,
      };
    }

    // 4. Thuốc lá điện tử (Vape): Đỉnh khói rất cao (> 80 ug/m3), hạt siêu mịn (PM1/PM2.5 >= 0.7), tắt nhanh (1 - 3 phút)
    if (
      feat.peak_pm25 >= 65 &&
      feat.pm1_pm25_ratio >= 0.65 &&
      feat.fall_time_seconds <= 200 &&
      feat.duration_seconds <= 300
    ) {
      probs.vape += 0.8;
      return {
        event_class: "vape",
        confidence: Math.min(0.94, probs.vape),
        probabilities: probs,
        explanation: `Khí dung mật độ cao đột biến (Đỉnh ${feat.peak_pm25} µg/m³), hạt siêu mịn chiếm ưu thế (${Math.round(feat.pm1_pm25_ratio * 100)}% PM1), tiêu tán nhanh sau 1-3 phút.`,
        features: feat,
      };
    }

    // 5. Thuốc lá truyền thống (Cigarette): Tăng dần trong 1-3 phút, tắt chậm kéo dài 10-25 phút, hạt mịn, có người
    if (
      feat.pm1_pm25_ratio >= 0.55 &&
      (feat.fall_time_seconds > 180 || feat.duration_seconds > 240) &&
      feat.presence_ratio > 0.2
    ) {
      probs.cigarette += 0.85;
      return {
        event_class: "cigarette",
        confidence: Math.min(0.95, probs.cigarette),
        probabilities: probs,
        explanation: `Đường cong khói thuốc lá điếu điển hình: thời gian tiêu tán kéo dài (${Math.round(feat.fall_time_seconds / 60)} phút), hạt mịn lơ lửng lâu, có người hiện diện tại chỗ (${Math.round(feat.presence_ratio * 100)}%).`,
        features: feat,
      };
    }

    // Mặc định thuốc lá điếu nếu có nồng độ khói và có người, ngược lại gán unclassified
    if (feat.peak_pm25 >= 35) {
      return {
        event_class: "cigarette",
        confidence: 0.72,
        probabilities: probs,
        explanation: `Nồng độ khói duy trì vượt ngưỡng an toàn, dự đoán khói thuốc lá dựa trên đặc trưng phổ hạt.`,
        features: feat,
      };
    }

    return {
      event_class: "unclassified",
      confidence: 0.5,
      probabilities: probs,
      explanation: "Chưa đủ dữ liệu đặc trưng rõ rệt để kết luận phân loại.",
      features: feat,
    };
  }
}

export const smokeClassifier = new SmokeEventClassifier();
