import React, { useEffect, useState } from "react";
import { platform, ZoneItem } from "../platform";

export function QrGeneratorPage() {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("all");

  useEffect(() => {
    platform.getZones().then(setZones);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const filteredZones =
    selectedZone === "all" ? zones : zones.filter((z) => z.code === selectedZone);

  return (
    <div className="page-qr-gen">
      <div className="card no-print">
        <div className="card-title">🖨️ Xuất bản & In Poster QR Hàng loạt</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          Công cụ dành cho Ban Quản lý toà nhà: Tự động sinh poster khổ chuẩn A4 có mã QR phản ánh ẩn danh, số hotline và cam kết quyền riêng tư để dán thực địa.
        </p>

        <div className="form-group">
          <label className="form-label">Chọn vị trí cần in poster:</label>
          <select
            className="form-select"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="all">In toàn bộ 25 vị trí (UET Hoà Lạc & Nhà đa năng)</option>
            {zones.map((z) => (
              <option key={z.code} value={z.code}>
                {z.name} ({z.code})
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="btn-primary" onClick={handlePrint}>
          🖨️ BẤM VÀO ĐÂY ĐỂ IN HOẶC LƯU PDF (A4)
        </button>
      </div>

      {/* Danh sách Poster chuẩn in */}
      <div className="printable-posters">
        {filteredZones.map((z) => {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
            `${window.location.origin}/?zone=${z.code}`
          )}`;

          return (
            <div
              key={z.code}
              style={{
                background: "#ffffff",
                border: "2px solid #17634c",
                borderRadius: 16,
                padding: "24px 20px",
                marginBottom: 20,
                textAlign: "center",
                pageBreakAfter: "always",
              }}
            >
              <div style={{ display: "inline-block", background: "#17634c", color: "#fff", padding: "4px 16px", borderRadius: 20, fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                ĐẠI HỌC QUỐC GIA HÀ NỘI — TRƯỜNG ĐH CÔNG NGHỆ (UET)
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#17634c", marginTop: 14 }}>
                KHU VỰC KHÔNG KHÓI THUỐC
              </h2>
              <p style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
                VNU SmarT-Free Zone · Vì Môi trường Học đường Trong lành
              </p>

              <div style={{ margin: "16px auto", width: 200, height: 200, padding: 8, background: "#fff", border: "1.5px solid #cbd5e1", borderRadius: 12 }}>
                <img src={qrUrl} alt={`QR Code ${z.code}`} style={{ width: "100%", height: "100%" }} />
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: 10, display: "inline-block", margin: "6px 0 12px 0" }}>
                <strong style={{ color: "#166534", fontSize: 15 }}>{z.name}</strong>
                <div style={{ fontSize: 12, color: "#15803d" }}>Mã toạ độ: {z.code} · {z.building} Tầng {z.floor}</div>
              </div>

              <div style={{ textAlign: "left", background: "#f8fafc", padding: 12, borderRadius: 8, fontSize: 12, color: "#334155", lineHeight: 1.6, marginTop: 10 }}>
                <div>✓ <strong>Quét mã bằng Camera / Zalo:</strong> Gửi phản ánh ẩn danh trong 30 giây.</div>
                <div>✓ <strong>Bảo vệ tuyệt đối:</strong> Không thu hình ảnh, không ghi âm thanh, không định danh cá nhân.</div>
                <div>✓ <strong>Hỗ trợ cai thuốc miễn phí:</strong> Tổng đài Quốc gia <strong>1800 6606</strong> (Miễn cước).</div>
              </div>

              <div style={{ marginTop: 12, fontSize: 11, color: "#94a3b8" }}>
                Nghị quyết 173/2024/QH15 & Điều 11 Luật Phòng, chống tác hại của thuốc lá
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
