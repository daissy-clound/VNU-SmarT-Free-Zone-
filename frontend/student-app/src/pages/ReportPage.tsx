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
      setErrorMessage("Vui lòng chọn hoặc quét mã QR toạ độ khu vực.");
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
        "KÍCH HOẠT HỖ TRỢ ƯU TIÊN:\nBạn có muốn gửi yêu cầu ưu tiên đến đội trực toà nhà để được hỗ trợ kiểm tra ngay lập tức?"
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
      title: "Mùi khói thuốc",
      desc: "Mùi khói còn lưu lại trong khu vực",
      Icon: WindIcon,
    },
  ];

  return (
    <div className="page-report">
      {/* Banner Hỗ trợ trực tiếp thân thiện, không gây hoảng loạn */}
      <div className={`support-callout ${emergency ? "active" : ""}`}>
        <div className="support-callout-info">
          <div className="support-callout-icon">
            {emergency ? <CheckCircleIcon size={20} strokeWidth={2.4} /> : <AlertTriangleIcon size={18} strokeWidth={2.2} />}
          </div>
          <div>
            <div className="support-callout-title">
              {emergency ? "Đang bật chế độ ưu tiên hỗ trợ" : "Cần hỗ trợ xử lý ngay tại chỗ?"}
            </div>
            <div className="support-callout-sub">
              {emergency
                ? "Phiếu sẽ được điều phối tức thời đến cán bộ trực hiện trường"
                : "Gửi thông báo nhanh khi phát sinh sự cố cần can thiệp gấp"}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-support-action"
          onClick={handleToggleEmergency}
        >
          {emergency ? "Huỷ yêu cầu" : "Cần hỗ trợ gấp"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Vị trí phản ánh */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <MapPinIcon size={17} color="var(--primary)" />
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
              <span>Nội dung ghi nhận</span>
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
                      <Icon size={17} strokeWidth={2} />
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
            className="switch-row"
            onClick={() => setOngoing(!ongoing)}
            role="switch"
            aria-checked={ongoing}
            style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 10, paddingTop: 10, cursor: "pointer" }}
          >
            <div className="switch-label-group">
              <div className="switch-title">
                Đang diễn ra tại vị trí này
              </div>
              <div className="switch-desc">
                Bật để cán bộ trực toà nhà ưu tiên tiếp nhận và hỗ trợ kịp thời
              </div>
            </div>
            <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={ongoing}
                onChange={(e) => setOngoing(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* Ghi chú tuỳ chọn */}
        <div className="card">
          <div className="card-title">
            <div className="card-title-left">
              <span>Ghi chú bổ sung</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Tuỳ chọn</span>
          </div>
          <textarea
            className="form-textarea"
            placeholder="Mô tả nhanh vị trí cụ thể (VD: góc sau thang máy, chiếu nghỉ tầng 3... Vui lòng không ghi tên cá nhân)."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
          />

          {/* Cam kết bảo mật Zero-PII */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              marginTop: 10,
              padding: "10px 12px",
              background: "var(--primary-subtle)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--primary-border)",
            }}
          >
            <ShieldCheckIcon size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.45 }}>
              <strong style={{ color: "var(--primary-dark)" }}>Bảo mật ẩn danh 100%:</strong> Hệ thống không lưu số điện thoại, tài khoản hay thông tin nhận dạng cá nhân của bạn.
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
              <span>Đang gửi thông tin...</span>
            </>
          ) : (
            <>
              <SendIcon size={16} strokeWidth={2.2} />
              <span>Gửi phản ánh ẩn danh</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
