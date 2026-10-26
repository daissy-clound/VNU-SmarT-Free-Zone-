import React, { useEffect, useState } from "react";
import { platform } from "../platform";
import {
  SparklesIcon,
  ZoomInIcon,
  DownloadIcon,
  ShareIcon,
  XIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  LeafIcon,
  NewspaperIcon,
  InfoIcon,
} from "../components/Icons";

export function PreventionPage() {
  const [infographics, setInfographics] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    platform.getInfographics().then((items) => {
      setInfographics(items);
    });
  }, []);

  const handleSharePoster = async () => {
    const shareUrl = window.location.origin + "/infographics/no-smoking-poster.png";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Không khói thuốc trọn tương lai — VNU SmarT-Free Zone",
          text: "Chung tay vì một môi trường học đường không khói thuốc tại ĐHQGHN!",
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const educationalCards = [
    {
      id: 1,
      tag: "NGHỊ QUYẾT 173/2024/QH15",
      title: "Cấm tuyệt đối thuốc lá điện tử & thuốc lá nung nóng",
      summary: "Từ 2025, Việt Nam cấm hoàn toàn sản xuất, kinh doanh, nhập khẩu, tàng trữ và sử dụng Pod, Vape.",
      details:
        "Nghị quyết số 173/2024/QH15 của Quốc hội khẳng định bảo vệ sức khoẻ thế hệ trẻ trước hiểm hoạ ma tuý và hoá chất độc hại ngụy trang dưới dạng Pod, Vape. Sinh viên tàng trữ hoặc sử dụng trong khuôn viên trường học sẽ bị xử lý kỷ luật nghiêm khắc.",
    },
    {
      id: 2,
      tag: "HIỂM HOẠ THẾ HỆ THỨ 3",
      title: "Khói thuốc thụ động thế hệ 3 (Thirdhand Smoke)",
      summary: "Khói thuốc không biến mất khi tàn thuốc tắt. Độc chất bám dai dẳng trên tường, rèm cửa, đệm KTX.",
      details:
        "Hạt bụi siêu mịn PM0.3 và các hợp chất nitrosamine tồn lưu nhiều tháng sau khi hút, phản ứng với các chất oxy hoá trong không khí tạo thành chất gây ung thư mới. Người sống cùng phòng chịu ảnh hưởng nặng nề mà không hề hay biết.",
    },
    {
      id: 3,
      tag: "CẢNH BÁO Y TẾ WHO",
      title: "Tổn thương phổi cấp (EVALI) do Vape",
      summary: "Vitamin E Acetate và kim loại nặng chì, niken trong tinh dầu gây xơ hoá phế nang phổi vĩnh viễn.",
      details:
        "Theo Tổ chức Y tế Thế giới (WHO), tinh dầu thuốc lá điện tử chứa hơn 16.000 hương liệu hóa học chưa qua kiểm nghiệm hít qua đường thở. Khi bị nung nóng ở nhiệt độ cao, chúng phân hủy thành formaldehyde và acrolein gây bỏng niêm mạc phổi.",
    },
    {
      id: 4,
      tag: "ĐIỀU 11 LUẬT PCTHTL",
      title: "Khuôn viên học đường không khói thuốc",
      summary: "Khu vực trong nhà trường đại học là nơi cấm hút thuốc hoàn toàn. Vi phạm bị xử phạt theo luật định.",
      details:
        "Quy định áp dụng đối với tất cả cán bộ, giảng viên và sinh viên tại mọi vị trí: phòng học, giảng đường, hành lang, cầu thang thoát hiểm và nhà vệ sinh chung. ĐHQGHN kiên quyết xây dựng môi trường văn minh học đường.",
    },
  ];

  return (
    <div className="page-prevention">
      {/* Chuỗi ngày tích cực */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          border: "1px solid #bbf7d0",
          borderRadius: "var(--radius-md)",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-sm)",
            background: "var(--primary)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 22,
            fontFamily: "monospace",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(11, 94, 66, 0.25)",
          }}
        >
          18
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <SparklesIcon size={14} color="var(--primary)" />
            <strong style={{ fontSize: 13, color: "var(--primary-dark)" }}>
              18 ngày liên tiếp giữ sạch không gian
            </strong>
          </div>
          <p style={{ fontSize: 11, color: "var(--primary-light)", marginTop: 2, lineHeight: 1.4 }}>
            Toà UET1 & Nhà đa năng đang giữ chuỗi không gian không khói kỷ lục. Cảm ơn sự chung tay của bạn!
          </p>
        </div>
      </div>

      {/* Poster Chiến Dịch Chính Thức */}
      <div className="poster-hero-card">
        <div className="card-title" style={{ padding: "14px 16px 0 16px" }}>
          <div className="card-title-left">
            <NewspaperIcon size={18} color="var(--primary)" />
            <span>Ấn phẩm truyền thông chính thức</span>
          </div>
          <span className="badge-pill badge-emerald">Ban hành 2026</span>
        </div>

        <div style={{ padding: "10px 16px 0 16px" }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
            Ấn phẩm áp phích tuyên truyền phòng chống thuốc lá và thuốc lá điện tử trong toàn thể sinh viên ĐHQGHN.
          </p>
        </div>

        {/* Khung xem trước poster */}
        <div
          className="poster-preview-wrapper"
          onClick={() => setLightboxImage("/infographics/no-smoking-poster.png")}
          title="Chạm để xem toàn màn hình"
        >
          <img
            src="/infographics/no-smoking-poster.png"
            alt="Áp phích: Không khói thuốc trọn tương lai"
            className="poster-preview-img"
            loading="lazy"
          />
          <div className="poster-zoom-hint">
            <ZoomInIcon size={14} color="#ffffff" />
            <span>Chạm để phóng to</span>
          </div>
        </div>

        <div className="poster-meta-content">
          <strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
            Áp phích: Không Khói Thuốc Trọn Tương Lai
          </strong>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
            Thông điệp 4 hành động: Nói Không · Bảo Vệ · Thay Đổi · Hành Động
          </p>

          <div className="poster-actions-row">
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, minHeight: 38, fontSize: 12 }}
              onClick={() => setLightboxImage("/infographics/no-smoking-poster.png")}
            >
              <ZoomInIcon size={14} />
              <span>Xem chi tiết</span>
            </button>
            <a
              href="/infographics/no-smoking-poster.png"
              download="VNU_Khong_Khoi_Thuoc_Tron_Tuong_Lai.png"
              className="btn-secondary"
              style={{ flex: 1, minHeight: 38, fontSize: 12, textDecoration: "none" }}
            >
              <DownloadIcon size={14} />
              <span>Tải áp phích</span>
            </a>
            <button
              type="button"
              className="btn-secondary"
              style={{ minHeight: 38, width: 44, padding: 0 }}
              onClick={handleSharePoster}
              title="Chia sẻ link áp phích"
            >
              <ShareIcon size={14} />
            </button>
          </div>
          {copiedLink && (
            <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 6, textAlign: "center", fontWeight: 600 }}>
              Đã sao chép link ảnh vào bộ nhớ tạm!
            </div>
          )}
        </div>
      </div>

      {/* Thẻ Kiến thức Tương tác */}
      <div className="card">
        <div className="card-title">
          <div className="card-title-left">
            <LeafIcon size={18} color="var(--primary)" />
            <span>Kiến thức & Khung pháp lý cần biết</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>4 chủ đề</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
          {educationalCards.map((card, idx) => {
            const isOpen = activeCard === idx;
            return (
              <div
                key={card.id}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  transition: "all 0.15s ease",
                  background: isOpen ? "#f8fafc" : "#ffffff",
                }}
              >
                <div
                  onClick={() => setActiveCard(isOpen ? null : idx)}
                  style={{
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    gap: 10,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>
                      {card.tag}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 2 }}>
                      {card.title}
                    </div>
                  </div>
                  <div
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      color: "var(--text-muted)",
                    }}
                  >
                    <ChevronRightIcon size={16} />
                  </div>
                </div>

                {isOpen && (
                  <div
                    style={{
                      padding: "0 14px 14px 14px",
                      borderTop: "1px solid var(--border-subtle)",
                      background: "#ffffff",
                      paddingTop: 10,
                    }}
                  >
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                      {card.details}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox xem ảnh toàn màn hình */}
      {lightboxImage && (
        <div className="modal-overlay" onClick={() => setLightboxImage(null)}>
          <button
            type="button"
            className="modal-close-btn"
            style={{ top: 20, right: 20, background: "rgba(255,255,255,0.9)" }}
            onClick={() => setLightboxImage(null)}
          >
            <XIcon size={20} />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "90vh",
              overflow: "auto",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <img
              src={lightboxImage}
              alt="Áp phích toàn màn hình"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
