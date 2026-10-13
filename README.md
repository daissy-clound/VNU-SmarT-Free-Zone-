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
│     ├─ src/pages/analytics/        E, D  Dự báo, Minh bạch thuật toán (chỉ hiển thị kết quả từ ai/)
│     ├─ src/sw.ts                      service worker nhận Web Push
│     └─ package.json
├─ scripts/
│  ├─ simulator/                     D  bộ giả lập 10 cảm biến (chạy cạnh backend trên máy chủ)
│  │  ├─ generate.ts                    sinh 6 tuần dữ liệu có nhãn
│  │  ├─ live.ts                        phát bản tin trực tiếp qua MQTT
│  │  ├─ scenarios/22h10-B5.ts          kịch bản demo
│  │  ├─ data/                          dữ liệu giả lập đã sinh (file lớn không đưa lên GitHub)
│  │  └─ README.md                      giải thích các thông số giả lập
│  ├─ wokwi-esp32/                   D  sketch.ino, diagram.json (dự án Wokwi)
│  └─ latency/                       D  công cụ đo độ trễ cảnh báo
├─ docs/                             E
│  ├─ thuyet-minh/                      bản thảo thuyết minh, hình, bảng
│  ├─ nhat-ky.md                        nhật ký triển khai hằng ngày
│  ├─ sop.md                            quy trình vận hành
│  ├─ quy-che-du-lieu.md                quy chế dữ liệu và quyền riêng tư
│  └─ assets/                           ảnh chụp màn hình, poster QR
├─ .gitignore
├─ package.json                         pnpm workspaces cho toàn repo
├─ pnpm-workspace.yaml                  gồm backend, frontend/*, scripts/simulator, scripts/latency
└─ README.md                            cách chạy, link demo, tài khoản cho BGK
