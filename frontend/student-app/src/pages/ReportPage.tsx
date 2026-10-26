import React, { useEffect, useState } from "react";
import { platform, ZoneItem, ReportResponse } from "../platform";

interface ReportPageProps {
  onSuccess: (code: string) => void;
  onOpenTrack: () => void;
}

export function ReportPage({ onSuccess, onOpenTrack }: ReportPageProps) {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [reportType, setReportType] = useState<"smoke_now" | "smell" | "vape" | "butts" | "other">("smoke_now");
  const [ongoing, setOngoing] = useState<boolean>(true);
  const [emergency, setEmergency] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUrlZone, setIsUrlZone] = useState<boolean>(false);

  useEffect(() => {
    platform.getZones().then((items) => {
      setZones(items);
      const urlZone = platform.getZoneFromUrl();
      if (urlZone) {
        setSelectedZone(urlZone);
        setIsUrlZone(true);
      } else if (items.length > 0) {
        setSelectedZone(items[0].code);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) {
      setErrorMessage("Vui lòng chọn hoặc quét mã QR khu vực.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res: ReportResponse = await platform.submitReport({
        zone_code: selectedZone,
        type: reportType,
        ongoing,
        emergency,
        note: note.trim() || undefined,
      });

      onSuccess(res.tracking_code);
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi gửi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyClick = () => {
    const confirmEmergency = window.confirm(
      "CẢNH BÁO KHẨN CẤP:\nBạn có chắc chắn muốn phát tín hiệu KHẨN CẤP (Cháy nổ, hỏa hoạn, có người ngất xỉu)?\n\nHệ thống sẽ lập tức báo động toàn bộ ca trực và chuyển cấp cứu 114 / 115."
    );
    if (confirmEmergency) {
      setEmergency(true);
      setReportType("smoke_now");
      setNote("TÌNH HUỐNG KHẨN CẤP TẠI HIỆN TRƯỜNG");
    }
  };

  const selectedZoneObj = zones.find((z) => z.code === selectedZone);

  return (
    <div className="page-report">
      {/* Nút Khẩn cấp */}
      <button type="button" className="btn-emergency" onClick={handleEmergencyClick}>
        🚨 <strong>TÌNH HUỐNG NGUY HIỂM / CHÁY NỔ (Gọi 114 · 115)</strong>
      </button>

      {emergency && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #dc2626", borderRadius: 8, padding: 12, marginBottom: 14 }}>
          <strong style={{ color: "#dc2626" }}>⚠️ Chế độ Báo động Khẩn cấp đang bật</strong>
          <p style={{ fontSize: 12, color: "#991b1b", marginTop: 4 }}>
            Phiếu sẽ được gán mức ưu tiên cao nhất (Urgent) và gửi cảnh báo đỏ tức thì tới điện thoại toàn bộ đội bảo vệ và y tế trường.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Chọn khu vực / Nhận diện từ QR */}
        <div className="card">
          <div className="card-title">
            <span>📍 Vị trí phản ánh</span>
            {isUrlZone && <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10 }}>Từ mã QR</span>}
          </div>

          {isUrlZone && selectedZoneObj ? (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 8 }}>
              <strong style={{ color: "#166534", fontSize: 15 }}>{selectedZoneObj.name}</strong>
              <div style={{ fontSize: 12, color: "#15803d", marginTop: 2 }}>Mã toạ độ: {selectedZoneObj.code} · Tầng {selectedZoneObj.floor}</div>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Chọn khu vực phát hiện vi phạm:</label>
              <select
                className="form-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Loại hành vi */}
        <div className="card">
          <div className="card-title">🔍 Hiện tượng phát hiện</div>
          <div className="type-grid">
            {[
              { id: "smoke_now", icon: "🚬", label: "Thuốc lá điếu", sub: "Khói đang bốc lên" },
              { id: "vape", icon: "💨", label: "Thuốc lá điện tử", sub: "Khí dung Pod / Vape" },
              { id: "smell", icon: "👃", label: "Mùi khói nồng", sub: "Mùi đặc quánh" },
              { id: "butts", icon: "🗑️", label: "Tàn thuốc / Rác", sub: "Đầu lọc, tàn vương vãi" },
              { id: "other", icon: "❓", label: "Khác", sub: "Hành vi vi phạm khác" },
            ].map((t) => (
              <button
                type="button"
                key={t.id}
                className={`type-btn ${reportType === t.id ? "active" : ""}`}
                onClick={() => setReportType(t.id as any)}
              >
                <span className="icon">{t.icon}</span>
                <span className="label">{t.label}</span>
                <span className="sub">{t.sub}</span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Đang có người hút tại chỗ?</span>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 6 }}>
              <input
                type="checkbox"
                checked={ongoing}
                onChange={(e) => setOngoing(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#17634c" }}
              />
              <span style={{ fontSize: 13 }}>{ongoing ? "Đang diễn ra" : "Đã rời đi"}</span>
            </label>
          </div>
        </div>

        {/* Ghi chú thêm & Cảnh báo quyền riêng tư */}
        <div className="card">
          <div className="card-title">📝 Chi tiết bổ sung (Tùy chọn)</div>
          
          <div className="privacy-notice">
            <span>🛡️</span>
            <div>
              <strong>Cam kết bảo mật & ẩn danh:</strong> Vui lòng <u>không</u> ghi tên, lớp hay số phòng cá nhân. Hệ thống tự động lọc PII bảo vệ bạn.
            </div>
          </div>

          <textarea
            className="form-textarea"
            placeholder="VD: Khói nhiều ở khúc cua chiếu nghỉ cầu thang hướng ra hồ nước..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
          />
          <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
            {note.length} / 300 ký tự
          </div>
        </div>

        {errorMessage && (
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {errorMessage}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Đang gửi phản ánh..." : "GỬI PHẢN ÁNH ẨN DANH (≤ 30s)"}
        </button>

        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            type="button"
            onClick={onOpenTrack}
            style={{ background: "none", border: "none", color: "#17634c", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
          >
            Đã có mã phiếu? Bấm vào đây để tra cứu tiến độ xử lý
          </button>
        </div>
      </form>
    </div>
  );
}
