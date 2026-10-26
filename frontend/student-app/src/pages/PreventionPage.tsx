import React, { useEffect, useState } from "react";
import { platform } from "../platform";

export function PreventionPage() {
  const [infographics, setInfographics] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState<number | null>(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    platform.getInfographics().then((items) => {
      setInfographics(items);
    });
  }, []);

  const educationalCards = [
    {
      id: 1,
      tag: "NGHỊ QUYẾT 173/2024/QH15",
      title: "Quốc hội Cấm Tuyệt đối Thuốc lá Điện tử & Thuốc lá Nung nóng",
      summary: "Từ năm 2025, Việt Nam cấm hoàn toàn sản xuất, kinh doanh, nhập khẩu, chứa chấp và sử dụng thuốc lá điện tử, thuốc lá nung nóng.",
      details:
        "Nghị quyết số 173/2024/QH15 của Quốc hội khẳng định bảo vệ sức khoẻ thế hệ trẻ trước hiểm hoạ ma tuý và hoá chất độc hại ngụy trang dưới dạng Pod, Vape. Sinh viên tàng trữ hoặc hút trong khuôn viên trường học sẽ bị xử lý kỷ luật nghiêm khắc.",
      icon: "⚖️",
    },
    {
      id: 2,
      tag: "HIỂM HOẠ THẾ HỆ THỨ 3",
      title: "Khói thuốc thụ động thế hệ 3 (Thirdhand Smoke) là gì?",
      summary: "Khói thuốc không biến mất khi tàn thuốc tắt. Các hạt độc chất bám dai dẳng trên tường, rèm cửa, bàn ghế và đệm KTX.",
      details:
        "Hạt bụi siêu mịn PM0.3 và các hợp chất nitrosamine tồn lưu nhiều tháng sau khi hút, phản ứng với các chất oxy hoá trong không khí tạo thành chất gây ung thư mới. Sinh viên phòng bên cạnh hoặc người dọn phòng chịu ảnh hưởng nặng nề mà không hề hay biết.",
      icon: "💨",
    },
    {
      id: 3,
      tag: "CẢNH BÁO Y TẾ WHO",
      title: "Hội chứng Tổn thương Phổi cấp (EVALI) do Vape",
      summary: "Vitamin E Acetate và kim loại nặng chì, niken, thiếc trong cuộn dây nung gây xơ hoá phế nang vĩnh viễn.",
      details:
        "Theo Tổ chức Y tế Thế giới (WHO), tinh dầu thuốc lá điện tử chứa hơn 16.000 hương liệu hóa học chưa qua kiểm nghiệm hít qua đường thở. Khi bị nung nóng ở nhiệt độ cao, chúng phân hủy thành formaldehyde và acrolein gây bỏng niêm mạc phổi.",
      icon: "🫁",
    },
    {
      id: 4,
      tag: "ĐIỀU 11 LUẬT PCTHTL",
      title: "Khuôn viên Học đường Không khói thuốc",
      summary: "Khu vực trong nhà trường đại học là nơi cấm hút thuốc hoàn toàn. Vi phạm bị phạt tiền từ 200.000đ đến 500.000đ.",
      details:
        "Quy định áp dụng đối với tất cả cán bộ, giảng viên và sinh viên tại mọi vị trí: phòng học, giảng đường, hành lang, cầu thang thoát hiểm và nhà vệ sinh chung. ĐHQGHN kiên quyết xây dựng môi trường văn minh học đường.",
      icon: "🏛️",
    },
  ];

  return (
    <div className="page-prevention">
      {/* Chuỗi ngày không khói tích cực */}
      <div className="streak-card">
        <div className="streak-number">18</div>
        <div>
          <strong style={{ fontSize: 15, color: "#92400e" }}>Ngày liên tục không khói thuốc</strong>
          <p style={{ fontSize: 12, color: "#b45309", marginTop: 2 }}>
            Toà UET1 & Nhà đa năng đang giữ chuỗi không gian sạch kỷ lục. Cảm ơn sự chung tay của bạn!
          </p>
        </div>
      </div>

      {/* Khung Infographic Tuyên truyền */}
      <div className="card">
        <div className="card-title">
          <span>🎨 Khung Infographic Truyền thông Học đường</span>
          <span style={{ fontSize: 11, background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 10 }}>BQL duyệt</span>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Không gian hiển thị các ấn phẩm đồ hoạ do Ban Quản lý và Đội ngũ thiết kế phát hành nhằm nâng cao nhận thức trong sinh viên.
        </p>

        {infographics.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {infographics.map((info) => (
              <div
                key={info.id}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1.5px solid #e2e8f0",
                  cursor: "pointer",
                }}
                onClick={() => setZoomedImage(info.image_url)}
              >
                <img
                  src={info.image_url}
                  alt={info.title}
                  style={{ width: "100%", height: "auto", display: "block", maxHeight: 320, objectFit: "cover" }}
                />
                <div style={{ padding: 12, background: "#ffffff" }}>
                  <strong style={{ fontSize: 14, color: "#1e293b" }}>{info.title}</strong>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#64748b" }}>
                    <span>📍 Áp dụng: {info.building || "Toàn trường"}</span>
                    <span>🔍 Chạm để phóng to</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Khung mockup sẵn sàng nhận ảnh do người dùng thiết kế */
          <div
            style={{
              border: "2px dashed #17634c",
              borderRadius: 12,
              padding: 20,
              background: "#f0fdf4",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
            <strong style={{ color: "#17634c", fontSize: 15 }}>
              Khung Trưng bày Infographic Truyền thông
            </strong>
            <p style={{ fontSize: 12, color: "#166534", marginTop: 6, lineHeight: 1.6 }}>
              Vị trí này được thiết kế sẵn để hiển thị các tác phẩm infographic chính thức do bạn cung cấp.
              Khi Ban Quản lý tải ảnh lên hệ thống, toàn bộ sinh viên trong khuôn viên sẽ tiếp cận được ngay lập tức.
            </p>
            <div style={{ marginTop: 12, display: "inline-block", background: "#dcfce7", color: "#15803d", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              ✓ Đã tích hợp API đồng bộ thời gian thực
            </div>
          </div>
        )}
      </div>

      {/* Thẻ kiến thức tương tác */}
      <div className="card">
        <div className="card-title">📚 Kiến thức Pháp lý & Sức khoẻ Cần biết</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
          Bấm vào từng thẻ để xem chi tiết các quy định pháp luật và bằng chứng y khoa cập nhật:
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {educationalCards.map((card, idx) => {
            const isOpen = activeCard === idx;
            return (
              <div
                key={card.id}
                onClick={() => setActiveCard(isOpen ? null : idx)}
                style={{
                  border: isOpen ? "1.5px solid #17634c" : "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  background: isOpen ? "#f8fafc" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{card.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#17634c", letterSpacing: 0.5 }}>
                      {card.tag}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>
                      {card.title}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {card.summary}
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 10,
                          borderTop: "1px dashed #cbd5e1",
                          fontSize: 12,
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        {card.details}
                      </div>
                    )}
                  </div>
                  <span style={{ color: "#94a3b8", fontSize: 14 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal phóng to ảnh infographic */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <img
            src={zoomedImage}
            alt="Infographic phóng to"
            style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}
