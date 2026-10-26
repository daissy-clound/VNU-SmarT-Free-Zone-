import React, { useState } from "react";
import { ReportPage } from "./pages/ReportPage";
import { TrackPage } from "./pages/TrackPage";
import { PreventionPage } from "./pages/PreventionPage";
import { QuitSupportPage } from "./pages/QuitSupportPage";
import { QrGeneratorPage } from "./pages/QrGeneratorPage";
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

  const handleReportSuccess = (trackingCode: string) => {
    setLatestTrackingCode(trackingCode);
    setSuccessModalOpen(true);
  };

  const copyTrackingCode = () => {
    if (latestTrackingCode) {
      navigator.clipboard.writeText(latestTrackingCode);
      alert("Đã sao chép mã tra cứu vào bộ nhớ tạm!");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">
            <div className="logo-badge">🌿</div>
            <div>
              <div className="app-title">VNU SmarT-Free Zone</div>
              <div className="app-subtitle">Không gian Học đường Không Khói thuốc</div>
            </div>
          </div>
          <a href="tel:18006606" className="hotline-chip">
            <span>📞</span> 1800.6606
          </a>
        </div>
      </header>

      {/* Main Tab Content */}
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

      {/* Modal thông báo gửi thành công */}
      {successModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div className="card success-card" style={{ maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h3 style={{ fontSize: 18, color: "#166534", fontWeight: 800 }}>GỬI PHẢN ÁNH THÀNH CÔNG!</h3>
            <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              Cảm ơn bạn đã chung tay bảo vệ môi trường học đường trong lành. Cán bộ trực đã nhận được thông báo điều phối.
            </p>

            <div>
              <span className="tracking-code-pill">{latestTrackingCode}</span>
            </div>

            <p style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>
              Vui lòng lưu lại mã này để theo dõi tiến độ xử lý 6 bước của Nhà trường (ẩn danh 100%).
            </p>

            <button type="button" className="btn-primary" onClick={copyTrackingCode} style={{ marginBottom: 8 }}>
              📋 Sao chép mã tra cứu
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSuccessModalOpen(false);
                setActiveTab("track");
              }}
            >
              Xem ngay tiến độ xử lý ›
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation Tabs */}
      <nav className="app-nav">
        <button
          type="button"
          className={`nav-item ${activeTab === "report" ? "active" : ""}`}
          onClick={() => setActiveTab("report")}
        >
          <span className="nav-icon">📢</span>
          <span>Phản ánh</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "track" ? "active" : ""}`}
          onClick={() => setActiveTab("track")}
        >
          <span className="nav-icon">🔍</span>
          <span>Tra cứu</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "prevention" ? "active" : ""}`}
          onClick={() => setActiveTab("prevention")}
        >
          <span className="nav-icon">🎨</span>
          <span>Truyền thông</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "support" ? "active" : ""}`}
          onClick={() => setActiveTab("support")}
        >
          <span className="nav-icon">❤️</span>
          <span>Cai thuốc</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === "qr_print" ? "active" : ""}`}
          onClick={() => setActiveTab("qr_print")}
        >
          <span className="nav-icon">🖨️</span>
          <span>In QR</span>
        </button>
      </nav>
    </>
  );
}
