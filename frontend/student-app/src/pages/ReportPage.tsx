import React, { useEffect, useState } from "react";
import { platform, ZoneItem, ReportResponse } from "../platform";
import {
  MapPinIcon,
  QrCodeIcon,
  AlertTriangleIcon,
  CigaretteIcon,
  VapeIcon,
  AshtrayIcon,
  WindIcon,
  ShieldCheckIcon,
  SendIcon,
  CheckCircleIcon,
  InfoIcon,
} from "../components/Icons";

interface ReportPageProps {
  onSuccess: (code: string) => void;
  onOpenTrack: () => void;
}

type ReportTypeOption = "smoke_now" | "vape" | "butts" | "smell";

export function ReportPage({ onSuccess, onOpenTrack }: ReportPageProps) {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [reportType, setReportType] = useState<ReportTypeOption>("smoke_now");
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

  const handleToggleEmergency = () => {
    if (!emergency) {
      const confirmEmergency = window.confirm(
        "KÍCH HOẠT CẢNH BÁO KHẨN CẤP:\nBạn có chắc chắn muốn phát tín hiệu KHẨN CẤP (Nguy cơ cháy nổ, hoả hoạn, sự cố nghiêm trọng)?\n\nHệ thống sẽ phát còi báo động tại phòng trực và kích hoạt đường dây nóng bảo vệ 24/7."
      );
      if (confirmEmergency) {
        setEmergency(true);
        setReportType("smoke_now");
        setOngoing(true);
      }
    } else {
      setEmergency(false);
    }
  };

  const selectedZoneObj = zones.find((z) => z.code === selectedZone);

  const reportTypes = [
    {
      key: "smoke_now" as ReportTypeOption,
      title: "Thuốc lá điếu",
      desc: "Khói hoặc tàn thuốc lá truyền thống",
      Icon: CigaretteIcon,
    },
    {
      key: "vape" as ReportTypeOption,
      title: "Pod / Vape điện tử",
      desc: "Khói thơm, khói dày pod/vape",
      Icon: VapeIcon,
    },
    {
      key: "butts" as ReportTypeOption,
      title: "Tàn / Mẩu đầu lọc",
      desc: "Đầu lọc, tàn thuốc bị vứt lại",
      Icon: AshtrayIcon,
    },
    {
      key: "smell" as ReportTypeOption,
      title: "Mùi khói nồng nặc",
      desc: "Mùi khói đọng kín không gian",
      Icon: WindIcon,
    },
  ];

  return (
    <div className="page-report">
      {/* Banner Khẩn cấp tinh tế */}
      <div className="emergency-callout">
        <div className="emergency-info">
          <div className="emergency-icon">
            <AlertTriangleIcon size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div className="emergency-title">Tình huống hoả hoạn hoặc nguy hiểm?</div>
            <div className="emergency-sub">Kích hoạt cảnh báo đỏ tới đội bảo vệ 24/7 & PCCC</div>
          </div>
        </div>
        <button
          type="button"
          className="btn-emergency-action"
          onClick={handleToggleEmergency}
        >
          {emergency ? "Tắt báo động" : "Báo khẩn cấp"}
        </button>
      </div>

      {emergency && (
        <div
          style={{
            background: "var(--accent-rose-subtle)",
            border: "1px solid var(--accent-rose-border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertTriangleIcon size={18} color="var(--accent-rose)" />
          <span style={{ fontSize: 12, color: "var(--accent-rose)", fontWeight: 600 }}>
            Chế độ Khẩn cấp đang BẬT: Phiếu sẽ chuyển thẳng mức ưu tiên cao nhất.
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Vị trí phản ánh */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <MapPinIcon size={18} color="var(--primary)" />
              <span>Vị trí phản ánh</span>
            </div>
            {isUrlZone ? (
              <span className="badge-pill badge-emerald">
                <QrCodeIcon size={12} />
                <span>Quét từ mã QR</span>
              </span>
            ) : (
              <span className="badge-pill badge-slate">Chọn thủ công</span>
            )}
          </div>

          {isUrlZone && selectedZoneObj ? (
            <div
              style={{
                background: "var(--primary-subtle)",
                border: "1px solid var(--primary-border)",
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <strong style={{ color: "var(--primary-dark)", fontSize: 14 }}>
                  {selectedZoneObj.name}
                </strong>
                <div style={{ fontSize: 11, color: "var(--primary-light)", marginTop: 2 }}>
                  Mã khu vực: {selectedZoneObj.code} · Tầng {selectedZoneObj.floor}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUrlZone(false)}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--primary-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 8px",
                  fontSize: 11,
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Đổi vị trí
              </button>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                required
              >
                <option value="" disabled>-- Chọn toạ độ toà nhà & tầng --</option>
                {zones.map((z) => (
                  <option key={z.code} value={z.code}>
                    {z.name} (Tầng {z.floor})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 4 Thẻ Phân loại hiện tượng */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <span>Hiện tượng ghi nhận</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Chạm để chọn 1 loại
            </span>
          </div>

          <div className="type-grid">
            {reportTypes.map(({ key, title, desc, Icon }) => {
              const active = reportType === key;
              return (
                <div
                  key={key}
                  className={`type-tile ${active ? "active" : ""}`}
                  onClick={() => setReportType(key)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                >
                  <div className="type-tile-header">
                    <div className="type-tile-icon">
                      <Icon size={18} strokeWidth={2} />
                    </div>
                    <div className="type-tile-check">
                      {active && <CheckCircleIcon size={14} strokeWidth={2.8} />}
                    </div>
                  </div>
                  <div className="type-tile-title">{title}</div>
                  <div className="type-tile-desc">{desc}</div>
                </div>
              );
            })}
          </div>

          {/* Công tắc hành vi đang diễn ra */}
          <div
            className="toggle-row"
            onClick={() => setOngoing(!ongoing)}
            role="switch"
            aria-checked={ongoing}
            style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 10, paddingTop: 12 }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                Hành vi đang diễn ra tại chỗ
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Bật để phòng trực ưu tiên xuất phát can thiệp tức thời (SLA ≤ 3 phút)
              </div>
            </div>
            <div className={`toggle-switch ${ongoing ? "on" : ""}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        </div>

        {/* Ghi chú tuỳ chọn */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <span>Ghi chú bổ sung (Tuỳ chọn)</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Không bắt buộc</span>
          </div>
          <textarea
            className="form-textarea"
            placeholder="Mô tả nhanh vị trí cụ thể (VD: góc sau thang máy, chiếu nghỉ tầng 3... - Vui lòng không ghi tên cá nhân)."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
          />

          {/* Cam kết bảo mật Zero-PII */}
          <div className="privacy-assurance">
            <ShieldCheckIcon size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="privacy-assurance-text">
              <strong>Bảo mật danh tính 100%:</strong> Hệ thống tuân thủ quy chuẩn Zero-PII. Chúng tôi không lưu số điện thoại, tài khoản hay địa chỉ IP của bạn.
            </div>
          </div>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "var(--accent-rose-subtle)",
              border: "1px solid var(--accent-rose-border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              color: "var(--accent-rose)",
              fontSize: 12,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <InfoIcon size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Nút gửi phản ánh chính */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !selectedZone}
        >
          {loading ? (
            <>
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: "2px solid #ffffff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
                className="animate-spin"
              />
              <span>Đang gửi phản ánh...</span>
            </>
          ) : (
            <>
              <SendIcon size={17} strokeWidth={2.2} />
              <span>GỬI PHẢN ÁNH ẨN DANH (≤ 30s)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
