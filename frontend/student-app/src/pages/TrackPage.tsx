import React, { useEffect, useState } from "react";
import { platform, TrackingDetail } from "../platform";
import {
  SearchIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  InfoIcon,
} from "../components/Icons";

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
    { key: "received", label: "Tiếp nhận thông tin", desc: "Hệ thống đã ghi nhận tin báo và cấp mã tra cứu" },
    { key: "assigned", label: "Điều phối ca trực", desc: "Đã phân công cán bộ trực toà nhà phụ trách" },
    { key: "verifying", label: "Có mặt & Kiểm tra", desc: "Cán bộ trực đã tới khu vực xác minh thực tế" },
    { key: "handled", label: "Hỗ trợ xử lý", desc: "Thực hiện nhắc nhở, dọn dẹp hoặc phối hợp xử lý" },
    { key: "responded", label: "Ghi nhận phản hồi", desc: "Ghi nhận kết quả xử lý và cập nhật hệ thống" },
    { key: "closed", label: "Hoàn tất xử lý", desc: "Khu vực đã được làm sạch, hoàn tất quy trình" },
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
        <div className="card-title">
          <div className="card-title-left">
            <SearchIcon size={17} color="var(--primary)" />
            <span>Tra cứu tiến độ xử lý</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Nhập mã tra cứu 8 ký tự (hoặc chọn phản ánh gần đây) để theo dõi quy trình phối hợp 6 bước minh bạch.
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="VD: K7Q2-9XMA"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            style={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
          />
          <button
            type="button"
            className="btn-primary"
            style={{ width: "auto", padding: "0 20px", flexShrink: 0 }}
            onClick={() => handleSearch()}
            disabled={loading}
          >
            {loading ? "..." : "Tra cứu"}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: "var(--accent-rose-subtle)",
              color: "var(--accent-rose)",
              padding: "10px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <InfoIcon size={15} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Kết quả chi tiết phiếu */}
      {detail && (
        <div className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Mã tra cứu phản ánh
              </span>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary-dark)", letterSpacing: "0.05em" }}>
                {detail.tracking_code}
              </div>
            </div>
            <span
              className={`badge-pill ${
                detail.status === "closed" ? "badge-emerald" : "badge-amber"
              }`}
            >
              {detail.status_label || detail.status}
            </span>
          </div>

          <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPinIcon size={15} color="var(--primary)" />
              <span><strong>Vị trí:</strong> {detail.zone_name}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ClockIcon size={15} color="var(--primary)" />
              <span><strong>Thời gian gửi:</strong> {new Date(detail.created_at).toLocaleString("vi-VN")}</span>
            </div>
            {detail.arrived_at && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircleIcon size={15} color="var(--primary)" />
                <span><strong>Cán bộ có mặt:</strong> {new Date(detail.arrived_at).toLocaleTimeString("vi-VN")}</span>
              </div>
            )}
          </div>

          {/* Phản hồi từ Ban Quản lý */}
          {detail.response_note && (
            <div
              style={{
                background: "var(--primary-subtle)",
                border: "1px solid var(--primary-border)",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                marginTop: 14,
              }}
            >
              <strong style={{ color: "var(--primary-dark)", fontSize: 12, textTransform: "uppercase" }}>
                Phản hồi từ Ban Quản lý / Phòng trực:
              </strong>
              <p style={{ fontSize: 13, color: "var(--primary-dark)", marginTop: 4, lineHeight: 1.5 }}>
                {detail.response_note}
              </p>
            </div>
          )}

          {/* 6 Bước tiến độ */}
          <div style={{ marginTop: 18 }}>
            <strong style={{ fontSize: 13, color: "var(--text-primary)", display: "block", marginBottom: 12 }}>
              Quy trình can thiệp 6 bước:
            </strong>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STEPS.map((s, idx) => {
                const status = getStepStatus(s.key, detail.status);
                const isDone = status === "done";
                const isActive = status === "active";
                return (
                  <div
                    key={s.key}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                      opacity: status === "pending" ? 0.45 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: isDone
                          ? "var(--primary)"
                          : isActive
                          ? "var(--accent-amber)"
                          : "var(--border-subtle)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? <CheckCircleIcon size={14} strokeWidth={2.8} /> : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử tra cứu gần đây */}
      {history.length > 0 && (
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <ClockIcon size={16} color="var(--primary)" />
              <span>Phản ánh gần đây của bạn</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Lưu cục bộ</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {history.map((item) => (
              <div
                key={item.code}
                onClick={() => {
                  setCode(item.code);
                  handleSearch(item.code);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--bg-muted)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "background-color 0.15s ease",
                }}
              >
                <div>
                  <strong style={{ color: "var(--primary-dark)", fontSize: 13 }}>{item.code}</strong>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                    {item.zone}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--primary)", fontSize: 12, fontWeight: 600 }}>
                  <span>Xem</span>
                  <ChevronRightIcon size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn-secondary"
        onClick={onBackToReport}
        style={{ marginTop: 6 }}
      >
        <span>+ Gửi phản ánh vị trí khác</span>
      </button>
    </div>
  );
}
