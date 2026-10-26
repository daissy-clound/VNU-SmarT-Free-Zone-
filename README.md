# VNU SmarT-Free Zone — Hệ sinh thái Giám sát & Quản trị Không gian Không khói thuốc

> **Dự án tham dự Cuộc thi Sáng tạo vì một thế hệ không khói thuốc — Đội BND (Trường ĐH Công nghệ, ĐHQGHN)**  
> *Hệ sinh thái toàn diện kết hợp: Mạch cảm biến IoT (ESP32/SPS30), Mô hình AI 2 tầng (Edge Filter & Analytics Service), Web App Sinh viên (PWA) và Dashboard Quản trị & Điều phối 6 bước.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)]()
[![React](https://img.shields.io/badge/React-19.2-cyan.svg)]()
[![Node](https://img.shields.io/badge/Node.js-%3E%3D22.12-green.svg)]()
[![Wokwi Simulation](https://img.shields.io/badge/Wokwi-ESP32%20Live-orange.svg)](https://wokwi.com/projects/478273736679993345)

---

## 📌 Các liên kết & Hướng dẫn quan trọng
- 📖 [Hướng dẫn trải nghiệm dành cho Ban Giám khảo (Live Demo & Sandbox)](docs/thuyet-minh/HUONG-DAN-BAN-GIAM-KHAO.md)
- 📝 [Thuyết minh sản phẩm Vòng 2](docs/thuyet-minh/THUYET-MINH-SAN-PHAM-VONG-2.md)
- 📊 [Bảng tổng hợp minh chứng tiến độ & cam kết](docs/thuyet-minh/BANG-TONG-HOP-MINH-CHUNG-TIEN-DO.md)
- ⚡ [Mạch mô phỏng phần cứng ESP32 trên Wokwi (Chạy trực tiếp)](https://wokwi.com/projects/478273736679993345)
- 🔒 [Quy chế dữ liệu & Quyền riêng tư (Zero-PII)](docs/quy-che-du-lieu-va-quyen-rieng-tu.md)
- 🎬 [Lời thoại video demo](docs/thuyet-minh/LOI-THOAI-VIDEO.md)
- 🔍 [Rà soát kỹ thuật 26/10 — việc đã sửa và việc còn mở theo từng thành viên](docs/ra-soat-ky-thuat-2026-10-26.md)

---

## 🚀 Khởi chạy hệ thống cục bộ (Local Development)

Yêu cầu môi trường: **Node.js >= 22.12**. Từ thư mục gốc:

```sh
# Cài đặt dependencies cho toàn bộ monorepo
npm ci

# Khởi chạy đồng thời Backend API (3001), Admin Dashboard (5173) và Student App (5174)
# Lần đầu tự tạo backend/.env và CSDL SQLite demo (npm run setup để làm lại từ đầu)
npm run dev
```

Triển khai: đặt `VITE_API_URL` cho cả `frontend/admin` và `frontend/student-app` (xem `.env.example` trong từng thư mục) khi API nằm khác origin.

### Ứng dụng & Tài khoản truy cập:
- **Ứng dụng Sinh viên (Quét QR & Hỗ trợ cai thuốc):** [http://127.0.0.1:5174](http://127.0.0.1:5174) (hoặc giả lập quét điểm nóng: [http://127.0.0.1:5174/?zone=UET1-3CT](http://127.0.0.1:5174/?zone=UET1-3CT))
- **Dashboard Quản lý & Ca trực:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Tài liệu API Swagger UI:** [http://127.0.0.1:3001/docs](http://127.0.0.1:3001/docs)

### Danh sách tài khoản thử nghiệm theo 4 vai trò (Mật khẩu: `Demo@2026`):
- `bgk`: Chế độ Sandbox độc lập dành riêng cho Ban Giám khảo.
- `bql`: Ban Quản lý (xem toàn cảnh, điều phối, đăng infographic, xem KPI).
- `trucuet1` … `trucuet4`: Phòng trực các toà nhà (giao diện 3 nút tinh gọn trên mobile: Đang đến / Đã đến / Báo nhầm).
- `baove` / `catruc`: Phòng bảo vệ 24/7 (tiếp nhận ca ngoài giờ, tuần tra đêm).
- `phantich`: Chuyên viên phân tích (minh bạch thuật toán, dự báo điểm nóng, báo cáo tuần).

---

## 🛠 Kiểm tra chất lượng & Test Suites
```sh
npm run typecheck      # Kiểm tra kiểu: backend, scripts, dashboard, app SV
npm run build          # Đóng gói cả 2 ứng dụng frontend
npm test               # Kiểm thử hợp đồng, máy chủ thử, điều phối, AI, luồng dashboard
npm run test:backend   # Kiểm thử backend thật (cần CSDL; tự chạy setup)
npm run test:e2e       # Kiểm thử trình duyệt (npx playwright install chromium trước)
```

---

## Cấu trúc thư mục dự án

```text
VNU-SmarT-Free-Zone/
├─ backend/                          A  API Node.js + TypeScript, kèm chương trình nhận MQTT
│  ├─ src/
│  │  ├─ contracts/                  A  NƠI DUY NHẤT định nghĩa mẫu dữ liệu
│  │  │  ├─ telemetry.ts                bản tin cảm biến
│  │  │  ├─ report.ts                   phản ánh của SV
│  │  │  ├─ ticket.ts                   sự kiện, phiếu, 6 trạng thái
│  │  │  ├─ zones.ts                    20 khu vực, 10 nút cảm biến
│  │  │  └─ index.ts                    xuất tất cả để nơi khác import
│  │  ├─ ai/                         E  NƠI DUY NHẤT chứa mọi phần AI
│  │  │  ├─ detect/                     tầng 1: so với mức nền, gắn cờ "nghi vấn", trích đặc trưng
│  │  │  ├─ classify/                   tầng 2: gắn loại sự kiện khi đợt khói kết thúc
│  │  │  ├─ forecast/                D  dự báo điểm nóng, lịch tuần tra gợi ý
│  │  │  ├─ llm/                        báo cáo tuần, phân loại ghi chú
│  │  │  ├─ training/                   huấn luyện và đánh giá (chạy riêng, không chạy trên máy chủ)
│  │  │  ├─ models/                     file mô hình đã huấn luyện (JSON)
│  │  │  └─ index.ts                    cửa ngõ duy nhất để phần còn lại gọi AI
│  │  ├─ api/                        A  REST + Socket.IO
│  │  │  ├─ reports.ts                  nhận phản ánh, trả mã tra cứu
│  │  │  ├─ tickets.ts                  xem và chuyển trạng thái phiếu
│  │  │  ├─ stats.ts                    KPI, bản đồ nhiệt
│  │  │  └─ auth.ts                     đăng nhập 4 vai trò
│  │  ├─ tickets/                    A  6 bước xử lý, gộp nguồn ±15 phút, hạn xử lý, chuyển cấp
│  │  ├─ ingest/                     A  nhận bản tin MQTT, lưu tóm tắt mỗi phút, chuyển cho ai/
│  │  ├─ notify/                     A  webpush.ts, zalo-bot.ts, zalo-oa.ts
│  │  └─ server.ts                   A  khởi động API và chương trình nhận MQTT
│  ├─ prisma/
│  │  ├─ schema.prisma               A  cấu trúc cơ sở dữ liệu
│  │  └─ seed.ts                     A  tài khoản demo, nạp dữ liệu giả lập
│  ├─ tests/                         A, E  kiểm thử luật 6 bước và phần AI
│  ├─ .env.example
│  └─ package.json
├─ frontend/
│  ├─ student-app/                   B  web app sinh viên (zmp-ui, PWA)
│  │  ├─ src/pages/                     Phản ánh, Đã gửi, Tra cứu, Hỗ trợ
│  │  ├─ src/platform.ts                lớp nền tảng, sau này thay bằng zmp-sdk của Zalo
│  │  └─ package.json
│  └─ admin/                         C  dashboard + màn hình ca trực (PWA)
│     ├─ src/pages/                     Tổng quan, Sơ đồ tầng, Phiếu, Ca trực
│     ├─ src/pages/analytics/        E, D  Dự báo, Minh bạch thuật toán
│     ├─ src/sw.ts                      service worker nhận Web Push
│     └─ package.json
├─ scripts/
│  ├─ simulator/                     D  bộ giả lập 10 cảm biến
│  │  ├─ generate.ts                    sinh 6 tuần dữ liệu có nhãn
│  │  ├─ live.ts                        phát bản tin trực tiếp qua MQTT
│  │  ├─ scenarios/22h10-B5.ts          kịch bản demo
│  │  ├─ data/                          dữ liệu giả lập
│  │  └─ README.md                      giải thích các thông số giả lập
│  ├─ wokwi-esp32/                   D  sketch.ino, diagram.json
│  └─ latency/                       D  công cụ đo độ trễ cảnh báo
├─ docs/                             E
│  ├─ thuyet-minh/                      bản thảo thuyết minh, hình, bảng
│  ├─ nhat-ky.md                        nhật ký triển khai hằng ngày
│  ├─ sop.md                            quy trình vận hành
│  ├─ quy-che-du-lieu.md                quy chế dữ liệu và quyền riêng tư
│  └─ assets/                           ảnh chụp màn hình, poster QR
├─ .gitignore
├─ package.json                         pnpm workspaces cho toàn repo
├─ pnpm-workspace.yaml                  cấu hình các workspace
└─ README.md                            cách chạy, link demo, tài khoản cho BGK
```
