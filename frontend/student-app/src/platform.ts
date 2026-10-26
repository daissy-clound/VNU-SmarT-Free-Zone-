/**
 * Platform layer cho Ứng dụng Sinh viên VNU SmarT-Free Zone
 * Hỗ trợ chạy mượt mà trên trình duyệt web thông thường (PWA)
 * và sẵn sàng cắm zmp-sdk khi đóng gói vào Zalo Mini App.
 */

export interface ZoneItem {
  code: string;
  name: string;
  building: string;
  floor: number;
}

export interface ReportPayload {
  zone_code: string;
  type: "smoke_now" | "smell" | "vape" | "butts" | "other";
  ongoing: boolean;
  emergency: boolean;
  note?: string;
  device_token?: string;
}

export interface ReportResponse {
  tracking_code: string;
  status: string;
  message?: string;
}

export interface TrackingDetail {
  tracking_code: string;
  ticket_code: string;
  status: "received" | "assigned" | "verifying" | "handled" | "responded" | "closed";
  status_label: string;
  created_at: string;
  zone_name: string;
  arrived_at?: string;
  handled_at?: string;
  response_note?: string;
  is_false_alarm?: boolean;
}

const DEVICE_KEY = "sfz_anon_device_token";
const TRACK_HISTORY_KEY = "sfz_my_reports";
const QUIT_PLAN_KEY = "sfz_quit_plan";

export const platform = {
  /**
   * Lấy mã khu vực từ URL (khi sinh viên quét QR dán tại địa điểm thực tế)
   */
  getZoneFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("zone") || params.get("z") || params.get("qr") || null;
  },

  /**
   * Lấy hoặc sinh mã thiết bị ẩn danh (Anonymous Device Token)
   * Không chứa thông tin cá nhân (không lấy IMEI, IP hay SĐT)
   */
  getAnonymousDeviceToken(): string {
    let token = localStorage.getItem(DEVICE_KEY);
    if (!token) {
      token = "anon-" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, token);
    }
    return token;
  },

  /**
   * Gửi phản ánh mới tới máy chủ
   */
  async submitReport(payload: ReportPayload): Promise<ReportResponse> {
    const token = this.getAnonymousDeviceToken();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, device_token: token }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || "Lỗi khi gửi phản ánh");
    }

    // Lưu mã tra cứu vào lịch sử cục bộ
    if (data.tracking_code) {
      this.saveLocalTrackingCode(data.tracking_code, payload.zone_code, payload.type);
    }

    return data;
  },

  /**
   * Tra cứu tiến độ xử lý theo mã phiếu
   */
  async trackReport(trackingCode: string): Promise<TrackingDetail> {
    const res = await fetch(`/api/reports/track/${encodeURIComponent(trackingCode.trim())}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Không tìm thấy thông tin phản ánh với mã này.");
    }
    return data;
  },

  /**
   * Lấy danh sách 25 khu vực khuôn viên UET
   */
  async getZones(): Promise<ZoneItem[]> {
    try {
      const res = await fetch("/api/zones");
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || [];
    } catch {
      return [
        { code: "UET1-3CT", name: "Chiếu nghỉ thang bộ F3 UET1", building: "UET1", floor: 3 },
        { code: "UET1-4WC", name: "Khu vệ sinh Nam F4 UET1", building: "UET1", floor: 4 },
        { code: "UET2-4ST", name: "Lối lên sân thượng UET2", building: "UET2", floor: 4 },
        { code: "UET3-5CTD", name: "Cầu thang Đông F5 UET3", building: "UET3", floor: 5 },
        { code: "UET4-4ST", name: "Lối sân thượng F4 UET4", building: "UET4", floor: 4 },
        { code: "G2-WC-F1", name: "Khu vệ sinh tầng 1 Nhà đa năng", building: "NhaDaNang", floor: 1 },
      ];
    }
  },

  /**
   * Lấy danh sách infographic tuyên truyền đang kích hoạt
   */
  async getInfographics(): Promise<any[]> {
    const officialPosters = [
      {
        id: "official-poster-2026",
        title: "Chiến dịch: Không Khói Thuốc Trọn Tương Lai — VNU UET",
        image_url: "/infographics/no-smoking-poster.png",
        building: "Toàn khuôn viên ĐHQGHN",
        created_at: new Date().toISOString(),
        description: "Thông điệp 4 hành động: Nói Không - Bảo Vệ - Thay Đổi - Hành Động vì một thế hệ học đường văn minh không khói thuốc.",
      },
    ];
    try {
      const res = await fetch("/api/infographics");
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length > 0) {
        const hasOfficial = data.items.some((i: any) => i.image_url?.includes("no-smoking-poster"));
        return hasOfficial ? data.items : [...officialPosters, ...data.items];
      }
      return officialPosters;
    } catch {
      return officialPosters;
    }
  },

  /**
   * Lưu lịch sử mã tra cứu trên máy sinh viên
   */
  saveLocalTrackingCode(code: string, zone: string, type: string) {
    try {
      const list = this.getLocalTrackingCodes();
      const existing = list.filter((i) => i.code !== code);
      existing.unshift({
        code,
        zone,
        type,
        created_at: new Date().toISOString(),
      });
      localStorage.setItem(TRACK_HISTORY_KEY, JSON.stringify(existing.slice(0, 20)));
    } catch {
      // Ignored
    }
  },

  getLocalTrackingCodes(): { code: string; zone: string; type: string; created_at: string }[] {
    try {
      const raw = localStorage.getItem(TRACK_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /**
   * Quản lý Kế hoạch cai thuốc lá cá nhân hoá
   */
  getQuitPlan(): any | null {
    try {
      const raw = localStorage.getItem(QUIT_PLAN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveQuitPlan(plan: any) {
    try {
      localStorage.setItem(QUIT_PLAN_KEY, JSON.stringify(plan));
    } catch {
      // Ignored
    }
  },

  clearQuitPlan() {
    localStorage.removeItem(QUIT_PLAN_KEY);
  },
};
