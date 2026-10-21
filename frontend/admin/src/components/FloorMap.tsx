import React from "react";
import type { Zone } from "../../../../backend/src/contracts";

const stateColors = {
  normal: "#16a34a",
  suspected: "#ea580c",
  offline: "#64748b",
  unknown: "#94a3b8",
};

const stateLabels = {
  normal: "Bình thường",
  suspected: "Nghi vấn có khói",
  offline: "Mất kết nối",
  unknown: "Chưa có dữ liệu",
};

export function FloorMap({
  zones,
  building,
  floor,
  selected,
  onSelect,
}: {
  zones: Zone[];
  building: string;
  floor: number;
  selected?: string;
  onSelect: (zone: Zone) => void;
}) {
  const currentZones = zones.filter(
    (z) => z.building === building && z.floor === floor,
  );

  return (
    <svg
      className="floor-svg"
      viewBox="0 0 1000 560"
      fontFamily="Segoe UI, Roboto, Helvetica, Arial, sans-serif"
      role="group"
      aria-label={`Sơ đồ toà ${building}, tầng ${floor}`}
    >
      <defs>
        {/* Pattern vạch đỗ xe */}
        <pattern id="parking-pattern" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="20" stroke="#cbd5e1" strokeWidth="2" />
        </pattern>
        {/* Pattern đài phun nước */}
        <radialGradient id="water-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="70%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </radialGradient>
      </defs>

      {/* ============================================================== */}
      {/* 1. MẶT BẰNG TỔNG THỂ KHUÔN VIÊN & CỔNG TRƯỜNG (CONG)            */}
      {/* ============================================================== */}
      {building === "CONG" && (
        <g id="campus-master-plan">
          {/* Nền khuôn viên cây xanh */}
          <rect x="20" y="50" width="960" height="480" rx="18" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="3" />

          {/* Dải đường giao thông nội khu (màu xám ghi) */}
          <path
            d="M 500 530 L 500 420 Q 500 350 420 350 L 320 350 Q 240 350 240 260 L 240 120 Q 240 70 320 70 L 680 70 Q 760 70 760 140 L 760 530 Z"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="38"
            strokeLinejoin="round"
          />
          <path
            d="M 500 530 L 500 420 Q 500 350 420 350 L 320 350 Q 240 350 240 260 L 240 120 Q 240 70 320 70 L 680 70 Q 760 70 760 140 L 760 530 Z"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeDasharray="10 8"
            strokeLinejoin="round"
          />

          {/* Dải bãi đỗ xe P bên phải */}
          <rect x="800" y="140" width="60" height="240" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
          <rect x="800" y="140" width="60" height="240" rx="6" fill="url(#parking-pattern)" opacity="0.6" />
          <text x="830" y="265" textAnchor="middle" fill="#475569" fontSize="20" fontWeight="bold">P</text>

          {/* Hồ nước tròn & Vòng xoay trung tâm */}
          <circle cx="480" cy="270" r="54" fill="#a7f3d0" stroke="#059669" strokeWidth="4" />
          <circle cx="480" cy="270" r="42" fill="url(#water-gradient)" stroke="#0284c7" strokeWidth="2" />
          <circle cx="480" cy="270" r="16" fill="#bae6fd" opacity="0.7" />
          <text x="480" y="275" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">HỒ NƯỚC</text>

          {/* Khối toà UET1 (Bên phải, toà 5 tầng) */}
          <g id="campus-block-uet1">
            <rect x="620" y="160" width="110" height="220" rx="8" fill="#e2e8f0" stroke="#475569" strokeWidth="3" />
            <rect x="635" y="175" width="80" height="190" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <text x="675" y="270" textAnchor="middle" fill="#1e293b" fontSize="16" fontWeight="bold">UET1</text>
            <text x="675" y="292" textAnchor="middle" fill="#64748b" fontSize="12">5 Tầng</text>
          </g>

          {/* Khối toà UET2 (Uốn cong dài bên trái) */}
          <g id="campus-block-uet2">
            <path
              d="M 330 180 Q 300 280 340 380 L 390 370 Q 355 280 380 190 Z"
              fill="#fef3c7"
              stroke="#d97706"
              strokeWidth="3"
            />
            <text x="350" y="280" textAnchor="middle" fill="#92400e" fontSize="16" fontWeight="bold">UET2</text>
            <text x="350" y="300" textAnchor="middle" fill="#b45309" fontSize="12">5 Tầng</text>
          </g>

          {/* Khối Nhà Đa Năng ĐN (Hình bán nguyệt + chữ nhật phía trên hồ nước) */}
          <g id="campus-block-dn">
            <rect x="420" y="90" width="110" height="90" rx="8" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3" />
            <path d="M 475 90 A 45 45 0 0 1 520 135 L 430 135 A 45 45 0 0 1 475 90 Z" fill="#ddd6fe" />
            <text x="475" y="160" textAnchor="middle" fill="#5b21b6" fontSize="15" fontWeight="bold">ĐN (2 Tầng)</text>
          </g>

          {/* Khối toà UET3 (Góc Tây Bắc) */}
          <g id="campus-block-uet3">
            <polygon points="170,110 270,110 270,180 220,180 220,220 170,220" fill="#e0e7ff" stroke="#4338ca" strokeWidth="3" />
            <text x="215" y="150" textAnchor="middle" fill="#3730a3" fontSize="15" fontWeight="bold">UET3</text>
            <text x="215" y="170" textAnchor="middle" fill="#4f46e5" fontSize="12">5 Tầng</text>
          </g>

          {/* Khối toà UET4 (Phía sau UET3) */}
          <g id="campus-block-uet4">
            <rect x="80" y="80" width="80" height="90" rx="6" fill="#fee2e2" stroke="#dc2626" strokeWidth="3" />
            <text x="120" y="130" textAnchor="middle" fill="#991b1b" fontSize="15" fontWeight="bold">UET4</text>
            <text x="120" y="150" textAnchor="middle" fill="#b91c1c" fontSize="12">4 Tầng</text>
          </g>

          {/* Nhãn 3 Cổng trường */}
          <g fill="#0f172a" fontSize="14" fontWeight="600">
            <rect x="410" y="470" width="180" height="42" rx="8" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
            <text x="500" y="497" textAnchor="middle" fill="#0369a1">CỔNG 1: CỔNG CHÍNH</text>

            <rect x="70" y="410" width="180" height="42" rx="8" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <text x="160" y="437" textAnchor="middle" fill="#334155">CỔNG 2: PHỤ TÂY</text>

            <rect x="750" y="410" width="180" height="42" rx="8" fill="#ffffff" stroke="#64748b" strokeWidth="2" />
            <text x="840" y="437" textAnchor="middle" fill="#334155">CỔNG 3: DỊCH VỤ/KTX</text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* 2. SƠ ĐỒ MẶT BẰNG TOÀ UET1 (5 TẦNG)                             */}
      {/* ============================================================== */}
      {building === "UET1" && (
        <g id="floor-plan-uet1">
          {/* Bao ngoài toà nhà */}
          <rect x="80" y="90" width="840" height="380" rx="14" fill="#f8fafc" stroke="#334155" strokeWidth="3" />
          {/* Hành lang chính */}
          <rect x="80" y="230" width="840" height="70" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          <text x="500" y="272" textAnchor="middle" fill="#64748b" fontSize="16" letterSpacing="4">HÀNH LANG TRUNG TÂM</text>

          {/* Phân chia phòng phía trên */}
          <line x1="280" y1="90" x2="280" y2="230" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="480" y1="90" x2="480" y2="230" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="720" y1="90" x2="720" y2="230" stroke="#cbd5e1" strokeWidth="2" />

          {/* Phân chia phòng phía dưới */}
          <line x1="280" y1="300" x2="280" y2="470" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="720" y1="300" x2="720" y2="470" stroke="#cbd5e1" strokeWidth="2" />

          {/* Buồng thang bộ phía Tây */}
          <rect x="100" y="110" width="160" height="340" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeDasharray="4 4" />
          <text x="180" y="170" textAnchor="middle" fill="#475569" fontSize="15" fontWeight="bold">CẦU THANG BỘ</text>
          <text x="180" y="195" textAnchor="middle" fill="#64748b" fontSize="13">(Lối thoát hiểm Tây)</text>

          {/* Khu WC phía Đông */}
          <rect x="740" y="110" width="160" height="340" rx="6" fill="#eff6ff" stroke="#93c5fd" />
          <text x="820" y="170" textAnchor="middle" fill="#1e40af" fontSize="15" fontWeight="bold">KHU VỆ SINH (WC)</text>
          <text x="820" y="195" textAnchor="middle" fill="#3b82f6" fontSize="13">Nam / Nữ</text>

          {/* Phòng học & Giảng đường */}
          <text x="380" y="170" textAnchor="middle" fill="#475569" fontSize="15">Giảng đường A</text>
          <text x="600" y="170" textAnchor="middle" fill="#475569" fontSize="15">Giảng đường B</text>
          <text x="500" y="400" textAnchor="middle" fill="#0f172a" fontSize="16" fontWeight="bold">
            {floor === 1 ? "SẢNH ĐÓN TIẾP CHÍNH (TẦNG 1)" : `PHÒNG HỌC & NGHIÊN CỨU (TẦNG ${floor})`}
          </text>
        </g>
      )}

      {/* ============================================================== */}
      {/* 3. SƠ ĐỒ MẶT BẰNG TOÀ UET2 (CẤU TRÚC UỐN CONG BÁN NGUYỆT)        */}
      {/* ============================================================== */}
      {building === "UET2" && (
        <g id="floor-plan-uet2">
          {/* Viền toà nhà hình vòng cung */}
          <path
            d="M 80 110 Q 500 60 920 110 L 920 450 Q 500 400 80 450 Z"
            fill="#fffbeb"
            stroke="#d97706"
            strokeWidth="3"
          />
          {/* Hành lang cong */}
          <path
            d="M 80 250 Q 500 210 920 250 L 920 310 Q 500 270 80 310 Z"
            fill="#fef3c7"
            stroke="#fde68a"
            strokeWidth="2"
          />
          <text x="500" y="270" textAnchor="middle" fill="#b45309" fontSize="16" letterSpacing="4">HÀNH LANG VÒNG CUNG</text>

          {/* Buồng thang bộ Tây */}
          <rect x="110" y="130" width="140" height="300" rx="6" fill="#fef9c3" stroke="#eab308" strokeDasharray="4 4" />
          <text x="180" y="180" textAnchor="middle" fill="#854d0e" fontSize="15" fontWeight="bold">CẦU THANG BỘ</text>
          <text x="180" y="205" textAnchor="middle" fill="#a16207" fontSize="13">(Điểm nóng khói thuốc)</text>

          {/* Khu WC Đông */}
          <rect x="750" y="130" width="140" height="300" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
          <text x="820" y="180" textAnchor="middle" fill="#1e40af" fontSize="15" fontWeight="bold">KHU VỆ SINH</text>

          {/* Giảng đường Lab */}
          <text x="360" y="170" textAnchor="middle" fill="#78350f" fontSize="15">Lab Viễn Thông</text>
          <text x="640" y="170" textAnchor="middle" fill="#78350f" fontSize="15">Phòng Lab AI</text>
          <text x="500" y="390" textAnchor="middle" fill="#78350f" fontSize="16" fontWeight="bold">
            {floor === 1 ? "SẢNH ĐÓN TOÀ UET2 (TẦNG 1)" : `GIẢNG ĐƯỜNG CONG TẦNG ${floor}`}
          </text>
        </g>
      )}

      {/* ============================================================== */}
      {/* 4. SƠ ĐỒ MẶT BẰNG TOÀ UET3 (KHỐI CHỮ L PHÒNG THỰC HÀNH)          */}
      {/* ============================================================== */}
      {building === "UET3" && (
        <g id="floor-plan-uet3">
          <polygon
            points="80,100 920,100 920,320 620,320 620,460 80,460"
            fill="#eef2ff"
            stroke="#4338ca"
            strokeWidth="3"
          />
          <rect x="80" y="210" width="840" height="60" fill="#e0e7ff" />
          <text x="420" y="248" textAnchor="middle" fill="#4338ca" fontSize="16" letterSpacing="3">HÀNH LANG PHÒNG LAB</text>

          {/* Buồng thang bộ */}
          <rect x="100" y="120" width="150" height="320" rx="6" fill="#ffffff" stroke="#818cf8" strokeDasharray="4 4" />
          <text x="175" y="180" textAnchor="middle" fill="#312e81" fontSize="15" fontWeight="bold">CẦU THANG BỘ</text>

          {/* Phòng thực hành & WC */}
          <rect x="740" y="120" width="160" height="180" rx="6" fill="#eff6ff" stroke="#93c5fd" />
          <text x="820" y="180" textAnchor="middle" fill="#1e40af" fontSize="15" fontWeight="bold">KHU WC TẦNG {floor}</text>

          <text x="480" y="160" textAnchor="middle" fill="#1e1b4b" fontSize="16" fontWeight="bold">PHÒNG THỰC HÀNH CÔNG NGHỆ</text>
          <text x="350" y="400" textAnchor="middle" fill="#3730a3" fontSize="15">
            {floor === 5 ? "LỐI LÊN SÂN THƯỢNG TOÀ UET3" : `KHU VĂN PHÒNG VIỆN (TẦNG ${floor})`}
          </text>
        </g>
      )}

      {/* ============================================================== */}
      {/* 5. SƠ ĐỒ MẶT BẰNG TOÀ UET4 (4 TẦNG)                             */}
      {/* ============================================================== */}
      {building === "UET4" && (
        <g id="floor-plan-uet4">
          <rect x="100" y="100" width="800" height="360" rx="14" fill="#fef2f2" stroke="#b91c1c" strokeWidth="3" />
          <rect x="100" y="230" width="800" height="60" fill="#fee2e2" />
          <text x="500" y="268" textAnchor="middle" fill="#991b1b" fontSize="16" letterSpacing="4">HÀNH LANG HỌC TẬP</text>

          {/* Cầu thang & Sân thượng */}
          <rect x="120" y="120" width="140" height="320" rx="6" fill="#ffffff" stroke="#f87171" strokeDasharray="4 4" />
          <text x="190" y="180" textAnchor="middle" fill="#7f1d1d" fontSize="15" fontWeight="bold">CẦU THANG BỘ</text>

          <rect x="700" y="120" width="180" height="320" rx="6" fill="#ffffff" stroke="#f87171" />
          <text x="790" y="180" textAnchor="middle" fill="#991b1b" fontSize="15" fontWeight="bold">
            {floor === 4 ? "SÂN THƯỢNG T4" : "KHU HỌC TẬP"}
          </text>

          <text x="470" y="170" textAnchor="middle" fill="#450a0a" fontSize="16">Phòng học chuyên đề</text>
          <text x="470" y="380" textAnchor="middle" fill="#450a0a" fontSize="16">
            {floor === 1 ? "SẢNH ĐÓN TOÀ UET4 (TẦNG 1)" : `PHÒNG HỌC LÝ THUYẾT TẦNG ${floor}`}
          </text>
        </g>
      )}

      {/* ============================================================== */}
      {/* 6. SƠ ĐỒ MẶT BẰNG NHÀ ĐA NĂNG ĐN (2 TẦNG)                       */}
      {/* ============================================================== */}
      {building === "DN" && (
        <g id="floor-plan-dn">
          {/* Khối sảnh chữ nhật bên trái */}
          <rect x="80" y="100" width="400" height="360" rx="12" fill="#faf5ff" stroke="#7e22ce" strokeWidth="3" />
          {/* Khối tròn sân thi đấu / khán đài bên phải */}
          <circle cx="680" cy="280" r="180" fill="#f3e8ff" stroke="#7e22ce" strokeWidth="3" />
          <circle cx="680" cy="280" r="130" fill="#ffffff" stroke="#c084fc" strokeWidth="2" strokeDasharray="6 4" />

          {/* Sân bóng / Khán đài */}
          <text x="680" y="275" textAnchor="middle" fill="#6b21a8" fontSize="18" fontWeight="bold">
            {floor === 1 ? "SÂN THI ĐẤU THỂ THAO ĐA NĂNG" : "KHÁN ĐÀI & PHÒNG TẬP GYM"}
          </text>
          <text x="680" y="305" textAnchor="middle" fill="#9333ea" fontSize="14">
            {floor === 1 ? "(Bóng rổ · Cầu lông · Sự kiện)" : "(Tầng 2 Nhà đa năng)"}
          </text>

          {/* Sảnh đón tiếp & Khu thay đồ */}
          <text x="280" y="160" textAnchor="middle" fill="#581c87" fontSize="17" fontWeight="bold">
            SẢNH ĐÓN TIẾP SINH VIÊN K71
          </text>
          <rect x="650" y="110" width="180" height="70" rx="8" fill="#ede9fe" stroke="#a855f7" />
          <text x="740" y="150" textAnchor="middle" fill="#6b21a8" fontSize="14" fontWeight="bold">
            KHU VỆ SINH & THAY ĐỒ
          </text>
        </g>
      )}

      {/* Tiêu đề góc trái sơ đồ */}
      <text x="35" y="35" fill="#0f172a" fontSize="20" fontWeight="700">
        {building === "CONG"
          ? "MẶT BẰNG TỔNG THỂ KHUÔN VIÊN UET HOÀ LẠC & 3 CỔNG TRƯỜNG"
          : `TOÀ ${building} · ${floor === 1 && building === "UET1" ? "TẦNG 1 (SẢNH CHÍNH)" : `TẦNG ${floor}`}`}
      </text>
      <text x="965" y="35" textAnchor="end" fill="#64748b" fontSize="14">
        Sơ đồ kiến trúc thực tế · Chuẩn tỷ lệ quy hoạch
      </text>

      {/* ============================================================== */}
      {/* VẼ CÁC ĐIỂM CẢM BIẾN VÀ ĐIỂM QR LÊN SƠ ĐỒ                      */}
      {/* ============================================================== */}
      {currentZones.map((zone) => (
        <g key={zone.code}>
          {selected === zone.code && (
            <rect
              x={zone.x - 45}
              y={zone.y - 45}
              width="150"
              height="95"
              rx="12"
              fill="#dcfce7"
              stroke="#15803d"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          )}

          {/* NÚT CẢM BIẾN IOT (Nếu có) */}
          {zone.sensor_id && (
            <g
              id={`sensor-${zone.sensor_id}`}
              data-zone-code={zone.code}
              data-state={zone.sensor_state}
              role="button"
              tabIndex={0}
              aria-label={`Cảm biến ${zone.sensor_id}: ${stateLabels[zone.sensor_state]}`}
              onClick={() => onSelect(zone)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(zone);
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <title>{`${zone.sensor_id} · ${stateLabels[zone.sensor_state]}`}</title>
              <circle
                cx={zone.x}
                cy={zone.y}
                r="22"
                fill={stateColors[zone.sensor_state]}
                stroke="white"
                strokeWidth="4"
              />
              {/* Icon sóng khói / nhịp tim */}
              <path
                d={`M${zone.x - 10} ${zone.y} h5 l4 -7 l4 14 l4 -7 h4`}
                stroke="white"
                strokeWidth="2.5"
                fill="none"
              />
            </g>
          )}

          {/* ĐIỂM MÃ QR TIẾP NHẬN BÁO CÁO */}
          <g
            id={zone.qr_id}
            data-zone-code={zone.code}
            role="button"
            tabIndex={0}
            aria-label={`Điểm QR ${zone.code}`}
            onClick={() => onSelect(zone)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(zone);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <title>{`${zone.qr_id} · Ký hiệu điểm quét QR tiếp nhận phản ánh`}</title>
            <rect
              x={zone.x + 30}
              y={zone.y - 18}
              width="36"
              height="36"
              rx="6"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Họa tiết mã QR mini */}
            <path
              d={`M${zone.x + 36} ${zone.y - 12}h7v7h-7z M${zone.x + 51} ${zone.y - 12}h7v7h-7z M${zone.x + 36} ${zone.y + 3}h7v7h-7z M${zone.x + 51} ${zone.y + 3}h7v7h-7z`}
              fill="#0f172a"
            />
          </g>

          {/* CHỈ BÁO HIỆN DIỆN PIR */}
          {zone.sensor_id && (
            <g
              id={`presence-${zone.sensor_id}`}
              aria-label={
                zone.presence === null
                  ? "Hiện diện: không rõ"
                  : zone.presence
                    ? "Có người tại chỗ"
                    : "Không còn ai"
              }
            >
              <circle
                cx={zone.x}
                cy={zone.y - 42}
                r="12"
                fill={
                  zone.presence === null
                    ? "#e2e8f0"
                    : zone.presence
                      ? "#bbf7d0"
                      : "#f1f5f9"
                }
                stroke={zone.presence ? "#16a34a" : "#94a3b8"}
                strokeWidth="1.5"
              />
              {zone.presence === null ? (
                <text x={zone.x} y={zone.y - 37} textAnchor="middle" fontSize="13" fill="#64748b" fontWeight="bold">
                  ?
                </text>
              ) : (
                <g stroke={zone.presence ? "#15803d" : "#64748b"} strokeWidth="1.8" fill="none">
                  <circle cx={zone.x} cy={zone.y - 46} r="3" />
                  <path d={`M${zone.x - 5} ${zone.y - 36} q0 -8 5 -8 q5 0 5 8`} />
                  {!zone.presence && <path d={`M${zone.x - 6} ${zone.y - 48} l12 12`} stroke="#ef4444" />}
                </g>
              )}
            </g>
          )}

          {/* NHÃN MÃ KHU VỰC */}
          <text
            x={zone.x + 22}
            y={zone.y + 38}
            textAnchor="middle"
            fill="#0f172a"
            fontSize="14"
            fontWeight="bold"
          >
            {zone.code}
          </text>
        </g>
      ))}

      {/* Chú thích phía dưới */}
      <g fill="#475569" fontSize="14">
        <text x="35" y="535">
          ● Cảm biến khói (Xanh: Bình thường · Cam: Nghi vấn) | ▣ Điểm quét mã QR SV | 👤 Cảm biến hiện diện PIR
        </text>
      </g>
    </svg>
  );
}
