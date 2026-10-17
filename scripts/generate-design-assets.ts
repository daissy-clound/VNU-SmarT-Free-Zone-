import { mkdirSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloorMap } from "../frontend/admin/src/components/FloorMap";
import { zones } from "./test-server/fixtures";

const dir = "docs/assets/c-d2";
mkdirSync(`${dir}/floors`, { recursive: true });
mkdirSync(`${dir}/wireframes`, { recursive: true });
for (const building of ["A", "B"])
  for (let floor = 1; floor <= 6; floor++) {
    const markup = renderToStaticMarkup(
      createElement(FloorMap, { building, floor, zones, onSelect: () => {} }),
    );
    writeFileSync(
      `${dir}/floors/${building}${floor}.svg`,
      `<?xml version="1.0" encoding="UTF-8"?>\n${markup.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')}\n`,
    );
  }
writeFileSync(
  `${dir}/zones-provisional.json`,
  JSON.stringify(
    {
      coordinates_status: "provisional",
      viewBox: "0 0 1000 560",
      items: zones,
    },
    null,
    2,
  ),
);

const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const text = (
  x: number,
  y: number,
  value: string,
  size = 16,
  fill = "#3a4e44",
) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}">${escape(value)}</text>`;
const box = (
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  lines: string[] = [],
) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="white" stroke="#99aaa1" stroke-dasharray="5 3"/>${text(x + 18, y + 30, title, 18)}${lines.map((line, i) => text(x + 18, y + 62 + i * 27, line, 14, "#6c7c73")).join("")}`;
function shell(title: string, content: string, mobile = false) {
  const width = mobile ? 430 : 1280;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 900" role="img" aria-label="Wireframe ${title}"><style>text{font-family:Arial,sans-serif}</style><rect width="${width}" height="900" fill="#f3f6f4"/>${mobile ? "" : `<rect width="210" height="900" fill="#e1e9e3"/>${text(24, 44, "VNU SmarT-Free Zone", 16)}${["Tổng quan", "Sơ đồ tầng", "Phiếu", "Phân tích", "Ca trực"].map((label, i) => text(28, 130 + i * 58, label)).join("")}${text(22, 824, "Menu theo vai trò", 14)}`}${text(mobile ? 24 : 242, 44, title, 26)}${text(mobile ? 24 : 242, 78, "D2 · 16/10/2026 · Bản phác thảo để thống nhất luồng", mobile ? 12 : 14)}${content}${text(mobile ? 24 : 242, 870, "Nghi vấn cần người xác minh · dữ liệu KTX giả lập", mobile ? 12 : 14)}</svg>`;
}
const screens = [
  [
    "01-tong-quan",
    "Tổng quan",
    [
      box(242, 112, 234, 120, "Phiếu đang xử lý", ["Số phiếu mở từ API"]),
      box(492, 112, 234, 120, "Quá hạn", ["Theo due_at của máy chủ"]),
      box(742, 112, 234, 120, "Đã xử lý", ["Không gọi là đã xác nhận"]),
      box(992, 112, 254, 120, "Khu vực", ["20 QR · 10 cảm biến"]),
      box(242, 258, 656, 350, "Phiếu mới nhất → Xem tất cả", [
        "Mã | Khu vực | Nguồn | Ưu tiên | Trạng thái | Hạn",
        "Bấm mã → mở thông tin phiếu",
        "Phiếu mới / cập nhật → tự đồng bộ",
        "Mất mạng → giữ dữ liệu cũ + cảnh báo + Thử lại",
      ]),
      box(922, 258, 324, 350, "Khung infographic", [
        "Ảnh + tiêu đề từ B",
        "Toà / khu vực áp dụng",
        "Thời gian hiển thị",
        "Chỉ BQL có quyền đăng (D6)",
      ]),
      box(242, 636, 1004, 150, "Quy trình 6 trạng thái", [
        "Tiếp nhận → Phân công → Xác minh → Xử lý → Phản hồi → Đóng",
        "KPI tính từ danh sách API; phân tích sâu nối ở các ngày sau.",
      ]),
    ].join(""),
  ],
  [
    "02-so-do-tang",
    "Sơ đồ tầng",
    box(242, 112, 1004, 86, "Bộ chọn", [
      "Toà A / B     Tầng 1–6     Chú giải màu + hiện diện",
    ]) +
      box(242, 224, 670, 460, "SVG · viewBox 1000 × 560", [
        "Khu vực chung      |      Phòng ở      |      Khu vực chung",
        "Thang Tây   ===== HÀNH LANG =====   Thang Đông",
        "● sensor-B5-CTD      ▣ QR-B5-CTD      ? presence-B5-CTD",
        "Mỗi cảm biến / QR có id riêng; đổi màu theo trạng thái.",
        "Bấm / Enter vào điểm → thông tin khu vực.",
        "Hiện diện: Có người / Không còn ai / Không rõ.",
        "Toạ độ tạm; chờ danh mục chính thức của A.",
      ]) +
      box(936, 224, 310, 460, "Thông tin khu vực", [
        "Mã, tên, toà, tầng",
        "Mã cảm biến / QR",
        "Trạng thái cảm biến",
        "Trạng thái hiện diện",
        "→ Xem danh sách phiếu",
      ]),
  ],
  [
    "03-phieu",
    "Danh sách phiếu",
    box(242, 112, 1004, 110, "Bộ lọc kết hợp", [
      "Trạng thái: 6 bước / tất cả     Khu vực: 20 điểm / tất cả     Xoá bộ lọc",
    ]) +
      box(242, 246, 1004, 360, "Bảng phiếu · dữ liệu API", [
        "Mã | Khu vực | Nguồn tin | Mức ưu tiên | Trạng thái | Thời hạn còn lại",
        "Nguồn: Cảm biến / Sinh viên / Cả hai / Khẩn cấp",
        "Hạn: Còn N phút / Quá hạn N phút / Đã hoàn tất xử lý / Chưa có thời hạn",
        "Bấm mã → ngăn thông tin (chỉ đọc D2)",
        "Có phân trang; cuộn ngang bảng trên màn hình hẹp.",
        "Không có kết quả → thông báo rỗng, cho xoá bộ lọc.",
        "Đang tải / lỗi kết nối / phiên hết hạn được phân biệt.",
      ]) +
      box(242, 632, 1004, 150, "Cập nhật trực tiếp", [
        "POST /api/reports từ B → API tạo/gộp phiếu → ticket:created / ticket:updated",
        "Dashboard tải lại danh sách; đối soát 5 giây để bù khi socket gián đoạn.",
      ]),
  ],
  [
    "04-phan-tich",
    "Phân tích",
    box(242, 112, 1004, 82, "Phạm vi D2: khung trang", [
      "Chưa có dữ liệu; không tạo số liệu đánh giá giả. Bàn giao E, D.",
    ]) +
      box(242, 220, 490, 250, "Bản đồ nhiệt", [
        "Tách lớp nghi vấn / đã xác nhận",
        "Bộ lọc toà, tuần, khu vực",
        "Nguồn API thống kê của A",
      ]) +
      box(756, 220, 490, 250, "Dự báo & tuần tra", [
        "Top 10 khu vực × khung giờ",
        "Lịch tuần tra gợi ý từ D",
        "Ghi rõ dựa trên dữ liệu mô phỏng",
      ]) +
      box(242, 496, 490, 250, "Minh bạch thuật toán", [
        "Ma trận nhầm lẫn; precision / recall",
        "Số sự kiện, tập kiểm tra từ E",
        "Giới hạn cảm biến hiện diện",
      ]) +
      box(756, 496, 490, 250, "Báo cáo tuần", [
        "Tổng hợp số liệu đã kiểm chứng",
        "Nguồn số liệu và thời gian cập nhật",
      ]),
  ],
  [
    "05-ca-truc-mobile",
    "Ca trực của tôi",
    box(22, 108, 386, 92, "☰ Menu       Ca trực", [
      "Phiếu của tôi · kết nối trực tiếp",
    ]) +
      box(22, 224, 386, 330, "Mã phiếu · Trạng thái", [
        "Khu vực / tầng / toà",
        "Nguồn tin + mức ưu tiên",
        "Hiện diện: có / không / không rõ",
        "Thời hạn còn lại",
        "→ Xem thông tin phiếu",
        "D3: Đang đến | Đã đến | Báo nhầm",
        "Nút thao tác chạm tối thiểu 44 px",
      ]) +
      box(22, 580, 386, 220, "Các bước tiếp theo", [
        "D2: hiển thị phiếu được giao",
        "D3: nối nút chuyển trạng thái",
        "D5: đăng ký nhận Web Push",
        "D6: phiếu xác minh, lịch sử đầy đủ",
      ]),
  ],
];
for (const [name, title, content] of screens)
  writeFileSync(
    `${dir}/wireframes/${name}.svg`,
    shell(title, content, name.includes("mobile")),
  );
writeFileSync(
  `${dir}/index.html`,
  `<!doctype html><html lang="vi"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C · Wireframe D2</title><style>body{font:16px Arial;background:#f3f6f4;color:#234738;margin:32px}img{width:100%;max-width:1280px;background:white;border:1px solid #ccd8ce;margin:16px 0}a{color:#17634c}.phone{max-width:430px}</style><h1>Wireframe dashboard · C · 16/10/2026</h1><p>5 trang để cả đội duyệt bố cục. Toạ độ sơ đồ tầng là đề xuất, chờ A xác nhận.</p>${screens.map(([name, title]) => `<h2>${title}</h2><a href="wireframes/${name}.svg">Mở SVG</a><br><img class="${name.includes("mobile") ? "phone" : ""}" src="wireframes/${name}.svg" alt="${title}">`).join("")}<h2>Sơ đồ 12 tầng</h2>${["A", "B"].map((building) => Array.from({ length: 6 }, (_, i) => `<a href="floors/${building}${i + 1}.svg">Toà ${building}, tầng ${i + 1}</a>`).join(" · ")).join("<br>")}<p><a href="zones-provisional.json">Danh mục 20 khu vực và toạ độ tạm</a></p></html>`,
);
console.log(
  "Đã xuất 5 wireframe, 12 sơ đồ SVG và 20 khu vực tại docs/assets/c-d2.",
);
