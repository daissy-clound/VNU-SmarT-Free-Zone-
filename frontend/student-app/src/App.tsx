import React, { useState } from "react";
import { ReportPage } from "./pages/ReportPage";
import { TrackPage } from "./pages/TrackPage";
import { PreventionPage } from "./pages/PreventionPage";
import { QuitSupportPage } from "./pages/QuitSupportPage";
import { QrGeneratorPage } from "./pages/QrGeneratorPage";
import {
  LeafIcon,
  PhoneIcon,
  MegaphoneIcon,
  SearchIcon,
  NewspaperIcon,
  HeartPulseIcon,
  QrCodeIcon,
  CheckCircleIcon,
  CopyIcon,
  XIcon,
  ChevronRightIcon,
} from "./components/Icons";
import "./styles.css";

type TabKey = "report" | "track" | "prevention" | "support" | "qr_print";

export function App() {
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as TabKey;
    if (tabParam && ["report", "track", "prevention", "support", "qr_print"].includes(tabParam)) {
      return tabParam;
    }
    return "report";
  });
  const [latestTrackingCode, setLatestTrackingCode] = useState<string | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const handleReportSuccess = (trackingCode: string) => {
    setLatestTrackingCode(trackingCode);
    setSuccessModalOpen(true);
  };

  const copyTrackingCode = () => {
    if (latestTrackingCode) {
      navigator.clipboard.writeText(latestTrackingCode);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleGoToTrack = () => {
    setSuccessModalOpen(false);
    setActiveTab("track");
  };

  return (
    <>
      {/* Top App Header */}
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">
            <div className="logo-badge" aria-label="Logo">
              <LeafIcon size={22} color="#ffffff" strokeWidth={2.2} />
            </div>
            <div>
              <div className="app-title">VNU SmarT-Free Zone</div>
              <div className="app-subtitle-row">
                <span className="app-subtitle">Môi trường Học đường Không Khói thuốc</span>
                <span className="campus-pill">UET · Hoà Lạc</span>
              </div>
            </div>
          </div>
          <a
            href="tel:18006606"
            className="hotline-chip"
            title="Đường dây nóng Tư vấn cai nghiện thuốc lá miễn phí (Bộ Y tế)"
          >
            <PhoneIcon size={13} color="#ffffff" strokeWidth={2.2} />
            <span>1800.6606</span>
          </a>
        </div>
      </header>

      {/* Main Tab View */}
      <main className="app-main">
        {activeTab === "report" && (
          <ReportPage
            onSuccess={handleReportSuccess}
            onOpenTrack={() => setActiveTab("track")}
          />
        )}

        {activeTab === "track" && (
          <TrackPage
            initialCode={latestTrackingCode || undefined}
            onBackToReport={() => setActiveTab("report")}
          />
        )}

        {activeTab === "prevention" && <PreventionPage />}

        {activeTab === "support" && <QuitSupportPage />}

        {activeTab === "qr_print" && <QrGeneratorPage />}
      </main>

      {/* Modal xác nhận gửi phản ánh thành công */}
      {successModalOpen && (
        <div className="modal-overlay" onClick={() => setSuccessModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setSuccessModalOpen(false)}
              aria-label="Đóng"
            >
              <XIcon size={18} />
            </button>

            <div style={{ textAlign: "center", paddingTop: 8 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "var(--primary-subtle)",
                  color: "var(--primary)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <CheckCircleIcon size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: 18, color: "var(--primary-dark)", fontWeight: 800 }}>
                GỬI PHẢN ÁNH THÀNH CÔNG
              </h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>
                Cảm ơn bạn đã chung tay bảo vệ khuôn viên trường. Thông tin đã được gửi tức thời đến cán bộ trực hiện trường.
              </p>

              <div className="tracking-code-badge" onClick={copyTrackingCode} title="Chạm để sao chép">
                <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                  Mã tra cứu ẩn danh (Tracking Code)
                </div>
                <div className="tracking-code-val">{latestTrackingCode}</div>
                <div className="tracking-code-hint">
                  <CopyIcon size={12} />
                  <span>{copyFeedback ? "Đã sao chép vào bộ nhớ tạm!" : "Chạm vào mã để sao chép"}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleGoToTrack}
                >
                  <span>Theo dõi tiến độ xử lý</span>
                  <ChevronRightIcon size={16} />
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSuccessModalOpen(false)}
                >
                  Đóng thông báo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Fixed Navigation Bar */}
      <nav className="app-nav" aria-label="Điều hướng chính">
        <button
          type="button"
          className={`nav-item ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          <div className="nav-icon-wrapper">
            <MegaphoneIcon size={20} strokeWidth={activeTab === "report" ? 2.3 : 1.8} />
          </div>
          <span>Phản ánh</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "track" ? "active" : ""}`}
          onClick={() => setActiveTab("track")}
        >
          <div className="nav-icon-wrapper">
            <SearchIcon size={20} strokeWidth={activeTab === "track" ? 2.3 : 1.8} />
          </div>
          <span>Tra cứu</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "prevention" ? "active" : ""}`}
          onClick={() => setActiveTab("prevention")}
        >
          <div className="nav-icon-wrapper">
            <NewspaperIcon size={20} strokeWidth={activeTab === "prevention" ? 2.3 : 1.8} />
          </div>
          <span>Truyền thông</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "support" ? "active" : ""}`}
          onClick={() => setActiveTab("support")}
        >
          <div className="nav-icon-wrapper">
            <HeartPulseIcon size={20} strokeWidth={activeTab === "support" ? 2.3 : 1.8} />
          </div>
          <span>Cai thuốc</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "qr_print" ? "active" : ""}`}
          onClick={() => setActiveTab("qr_print")}
        >
          <div className="nav-icon-wrapper">
            <QrCodeIcon size={20} strokeWidth={activeTab === "qr_print" ? 2.3 : 1.8} />
          </div>
          <span>In mã QR</span>
        </button>
      </nav>
    </>
  );
}
