## Chạy dashboard C — D2 (16/10/2026)

Yêu cầu Node.js >= 22.12. Từ thư mục gốc:

```sh
npm ci
npm run dev
```

Mở **http://127.0.0.1:5173**, đăng nhập `bql` / `Demo@2026`. Các tài khoản thử khác: `catruc`, `phantich`, `bgk` (cùng mật khẩu). API cục bộ chạy tại cổng 3001, dữ liệu RAM được đặt lại khi khởi động.

Mở trang **Phiếu**, chạy `npm run report:demo -- B5-CTD` trong terminal thứ hai: phiếu từ HTTP API tự xuất hiện trên dashboard. Phạm vi bàn giao hiện tại là localhost theo yêu cầu; có hướng dẫn nối máy chủ A/B khi sẵn sàng.

- [Bàn giao C 21/10 — mục II: trang phiếu, ca trực điện thoại 3 nút, tổng quan realtime, bản đồ nhiệt, PWA](docs/ban-giao-C-2026-10-21.md) · [Hướng dẫn cài app ca trực trên iPhone](docs/huong-dan-ca-truc-iphone.md).
- [Wireframe 5 trang và sơ đồ 12 tầng](docs/assets/c-d2/index.html).
- [Bàn giao C cho A/E: hợp đồng API, tài khoản, cách tích hợp và giới hạn D2](docs/ban-giao-C-2026-10-16.md).
- Kiểm tra: `npm run typecheck`, `npm run build`, `npm test`; kiểm thử trình duyệt: `npx playwright install chromium` rồi `npm run test:e2e`.
- Toạ độ khu vực hiện là bản đề xuất, chờ A xác nhận. Máy chủ thử nằm riêng tại `scripts/test-server/`.

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
