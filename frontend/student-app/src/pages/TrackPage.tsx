import React, { useEffect, useState } from "react";
import { platform, TrackingDetail } from "../platform";

interface TrackPageProps {
  initialCode?: string;
  onBackToReport: () => void;
}

export function TrackPage({ initialCode, onBackToReport }: TrackPageProps) {
  const [code, setCode] = useState<string>(initialCode || "");
  const [loading, setLoading] = useState<boolean>(false);
  const [detail, setDetail] = useState<TrackingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    setHistory(platform.getLocalTrackingCodes());
    if (initialCode) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (targetCode?: string) => {
    const searchCode = (targetCode || code).trim().toUpperCase();
    if (!searchCode) {
      setError("Vui lòng nhập mã tra cứu (VD: K7Q2-9XMA).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await platform.trackReport(searchCode);
      setDetail(data);
    } catch (err: any) {
      setError(err.message || "Không thể tìm thấy phiếu.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const STEPS: { key: TrackingDetail["status"]; label: string; desc: string }[] = [
    { key: "received", label: "Tiếp nhận phản ánh", desc: "Hệ thống đã ghi nhận tin báo và gán mã xử lý" },
    { key: "assigned", label: "Điều phối ca trực", desc: "Đã phân công cán bộ trực toà nhà phụ trách" },
    { key: "verifying", label: "Có mặt & Xác minh", desc: "Cán bộ trực đã đến hiện trường kiểm tra" },
    { key: "handled", label: "Xử lý vi phạm", desc: "Thực hiện nhắc nhở, lập biên bản hoặc giải tỏa" },
    { key: "responded", label: "Ban Quản lý phản hồi", desc: "Gửi thông tin kết quả tới người phản ánh" },
    { key: "closed", label: "Đóng phiếu hoàn tất", desc: "Khu vực đã được làm sạch, hoàn tất quy trình" },
  ];

  const getStepStatus = (stepKey: TrackingDetail["status"], currentStatus: TrackingDetail["status"]) => {
    const order = ["received", "assigned", "verifying", "handled", "responded", "closed"];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(stepKey);

    if (stepIdx < currentIdx) return "done";
    if (stepIdx === currentIdx) return "active";
    return "pending";
  };

  return (
    <div className="page-track">
      <div className="card">
        <div className="card-title">🔍 Tra cứu Tiến độ Xử lý Phản ánh</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Nhập mã tra cứu (8 ký tự) bạn nhận được khi gửi phản ánh để theo dõi quy trình can thiệp 6 bước của Nhà trường.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="VD: K7Q2-9XMA"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ fontWeight: 700, letterSpacing: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ width: "auto", padding: "0 18px" }}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? "..." : "Tra cứu"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, fontSize: 13, marginTop: 12 }}>
            {error}
          </div>
        )}
      </div>

      {/* Kết quả chi tiết phiếu */}
      {detail && (
        <div className="card" style={{ borderLeft: "4px solid #17634c" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Mã tra cứu:</span>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#17634c" }}>{detail.tracking_code}</div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 20,
                background: detail.status === "closed" ? "#dcfce7" : "#fef3c7",
                color: detail.status === "closed" ? "#15803d" : "#b45309",
              }}
            >
              {detail.status_label || detail.status}
            </span>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: "#475569" }}>
            <div>📍 <strong>Vị trí:</strong> {detail.zone_name}</div>
            <div>⏱️ <strong>Thời gian gửi:</strong> {new Date(detail.created_at).toLocaleString("vi-VN")}</div>
            {detail.arrived_at && (
              <div>🏃 <strong>Cán bộ có mặt lúc:</strong> {new Date(detail.arrived_at).toLocaleTimeString("vi-VN")}</div>
            )}
          </div>

          {/* Phản hồi từ Ban Quản lý */}
          {detail.response_note && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 12, borderRadius: 8, marginTop: 14 }}>
              <strong style={{ color: "#166534", fontSize: 13 }}>💬 Phản hồi từ Ban Quản lý KTX / Trường:</strong>
              <p style={{ fontSize: 13, color: "#15803d", marginTop: 4 }}>
                {detail.response_note}
              </p>
            </div>
          )}

          {/* 6 Bước tiến độ */}
          <div style={{ marginTop: 20 }}>
            <strong style={{ fontSize: 14, color: "#1e293b" }}>Quy trình Can thiệp 6 Bước:</strong>
            <div className="timeline">
              {STEPS.map((s, idx) => {
                const status = getStepStatus(s.key, detail.status);
                return (
                  <div key={s.key} className={`timeline-step ${status}`}>
                    <div className="step-dot">{status === "done" ? "✓" : idx + 1}</div>
                    <div className="step-title">{s.label}</div>
                    <div className="step-desc">{s.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử tra cứu cục bộ */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-title">🕒 Các phản ánh gần đây của bạn</div>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
            Được lưu riêng tư trên thiết bị của bạn để bạn tiện theo dõi lại:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map((item) => (
              <div
                key={item.code}
                onClick={() => {
                  setCode(item.code);
                  handleSearch(item.code);
                }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ color: "#17634c" }}>{item.code}</strong>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Khu vực: {item.zone}</div>
                </div>
                <span style={{ fontSize: 12, color: "#17634c", fontWeight: 600 }}>Xem tiến độ ›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="btn-secondary" onClick={onBackToReport}>
        + Gửi phản ánh mới
      </button>
    </div>
  );
}
