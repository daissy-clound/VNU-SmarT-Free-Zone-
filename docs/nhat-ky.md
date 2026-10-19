# Nhật ký triển khai

## 16/10/2026 — C: dashboard D2 trên localhost

Đã dựng 5 wireframe, 12 sơ đồ tầng SVG (10 cảm biến, 20 ký hiệu QR), dashboard React + Ant Design tiếng Việt, đăng nhập/menu theo 4 vai trò và danh sách phiếu có lọc, thời hạn, cập nhật Socket.IO. Bản Tổng quan có khung infographic; Ca trực có bố cục điện thoại. [Ảnh tổng quan](assets/c-d2/screenshots/overview.png), [ảnh danh sách phiếu](assets/c-d2/screenshots/tickets.png), [bàn giao A/E](ban-giao-C-2026-10-16.md).

Người giao việc xác nhận triển khai localhost trước vì chưa có URL máy chủ thử. Máy chủ tích hợp cục bộ nhận phản ánh HTTP đúng mẫu của B, tạo/gộp phiếu rồi phát sự kiện; chưa phải backend sản xuất của A. Toạ độ và 10 vị trí QR bổ sung là bản đề xuất, chờ A xác nhận.

Kết quả kiểm tra cuối:

- `npm run typecheck`: đạt.
- `npm run build`: đạt; chia bundle giao diện/thư viện. Rollup chỉ cảnh báo annotation trong thư viện Zod, không ảnh hưởng build.
- `npm test`: 6/6 kiểm thử API đạt (xác thực, danh mục, tạo phiếu + socket, đầu vào/gộp/khẩn cấp/giới hạn, CORS local dev/preview, đăng xuất).
- `npm run test:e2e`: 6/6 kiểm thử Chromium đạt, gồm 4 vai trò, lọc phiếu, chọn SVG bằng bàn phím, reload giữ phiên, màn hình 390 px, lỗi mạng, hết phiên và dự phòng HTTP khi socket gián đoạn.
- Lượt kiểm tra trình duyệt cuối: POST phản ánh → hàng phiếu hiện trên UI sau **595 ms**, không tải lại trang. Đây là một lần đo localhost, không phải P95 hoặc số đo vận hành thực tế.
- Kiểm tra XML: 5 wireframe và 12 sơ đồ hợp lệ; đúng 10 ID cảm biến, 20 ID QR, không trùng ID giữa các sơ đồ.
- Bản build production đã mở trong Chromium, đăng nhập và tải KPI thành công, không có lỗi JavaScript runtime. Đã sửa danh sách origin để bản preview local cũng đăng nhập được.

Tiếp theo: A duyệt API/vai trò/toạ độ; B gửi từ app SV khi có bản tích hợp; E nhận khung phân tích. D3 nối cập nhật trạng thái, D5 Web Push, D6 đăng infographic theo kế hoạch.

## 16/10/2026 — C: cải thiện trải nghiệm sử dụng

Theo yêu cầu chỉnh giao diện thân thiện hơn: tăng cỡ chữ và độ tương phản; thêm cảnh báo quá hạn có thể bấm từ Tổng quan; tìm phiếu bằng mã/tên khu vực không cần gõ dấu; lọc nhanh và sắp xếp phiếu cần chú ý. Bộ lọc được lưu trong URL để giữ khi tải lại trang.

Điện thoại hiển thị phiếu bằng thẻ có đủ thông tin, có thanh điều hướng dưới cùng và bộ lọc chi tiết có thể thu gọn. Sơ đồ có tìm kiếm khu vực và nút chọn điểm dễ chạm; từ phiếu mở đúng sơ đồ, từ sơ đồ mở danh sách đã lọc đúng khu vực. Gỡ nút ca trực chưa sử dụng được, thay lời hướng dẫn kỹ thuật bằng thông báo dễ hiểu.

Ảnh sau chỉnh sửa: [Tổng quan](assets/c-d2/screenshots/overview.png), [Phiếu trên máy tính](assets/c-d2/screenshots/tickets-ux.png), [Phiếu trên điện thoại](assets/c-d2/screenshots/tickets-mobile.png). Đã kiểm tra luồng tìm kiếm, giữ bộ lọc, liên kết phiếu–sơ đồ và màn hình hẹp 320 px; bộ 8 kiểm thử trình duyệt đạt. Sau tinh chỉnh thu gọn bộ lọc, 2 kiểm thử cho các luồng bị tác động chạy lại và đạt; TypeScript, build cuối và kiểm tra truy cập localhost đều đạt.

## 16/10/2026 — A: Nền móng backend, 3 hợp đồng dữ liệu, CSDL Prisma và API tích hợp D2

Đã hoàn thành toàn bộ khung xương kỹ thuật theo phân công D2 của Thành viên A (Ly):
1. **3 Hợp đồng dữ liệu (`backend/src/contracts/`):** Hoàn thiện và chuẩn hoá `telemetry.ts` (thêm `presence`, `presence_age`, `late`), `report.ts` (ẩn danh, che PII, mã tra cứu ngẫu nhiên), `ticket.ts` (máy trạng thái 6 bước, 4 nguồn, SLA), và `zones.ts` (phê duyệt danh mục 20 khu vực và 10 cảm biến KTX ĐHQGHN do C đề xuất).
2. **Cơ sở dữ liệu (`backend/prisma/`):** Thiết kế schema 9 bảng (`Zone`, `Device`, `Telemetry`, `Event`, `Ticket`, `TicketHistory`, `Report`, `User`, `Infographic`), kèm seed script nạp 20 khu vực, 10 thiết bị cảm biến, 4 tài khoản demo (`bql`, `catruc`, `phantich`, `bgk`), 6 phiếu mẫu ban đầu và 1 infographic mẫu.
3. **API & Realtime Socket.IO (`backend/src/api/`):** Triển khai server Express + Socket.IO tại port 3001, các endpoint xác thực theo vai trò, tiếp nhận phản ánh, tra cứu tiến độ phản ánh, danh sách phiếu, chuyển trạng thái và KPI thống kê.
4. **Kiểm thử:** Đã viết bộ test hợp đồng dữ liệu và API end-to-end (`backend/tests/`). Đã đối chiếu và tương thích 100% với Dashboard Admin của Cúc và luồng QR của Mạnh. [Tài liệu bàn giao](ban-giao-A-2026-10-16.md).

## 17/10/2026 — A: Tích hợp MQTT Ingest & Chuyển đổi danh mục khu vực UET Hoà Lạc (D3)

1. **Cập nhật khu vực thực tế:** Chuyển đổi danh mục sang Trường Đại học Công nghệ (UET) tại Hoà Lạc theo yêu cầu: 4 toà UET (UET1 5 tầng, UET2 5 tầng, UET3 5 tầng, UET4 4 tầng), Nhà đa năng (2 tầng) và 3 Cổng trường Hoà Lạc. Tổng cộng 25 vị trí mã QR và 10 nút cảm biến IoT tại các điểm nóng khói thuốc.
2. **MQTT Telemetry Ingest (`backend/src/ingest/mqtt.ts`):** Triển khai chương trình nền nhận bản tin telemetry 5s/lần, lưu bản tóm tắt 1 phút và theo dõi nhịp sống cảm biến.
3. **Tự động mở phiếu:** Kết nối thuật toán phát hiện khói bất thường (PM2.5 ≥ 35 ug/m3) để tự động sinh sự kiện và mở phiếu `SF-...`.

## 18/10/2026 — A: Gộp nguồn ±15 phút, Kiểm soát SLA & Kênh Web Push ca trực (D4)

1. **Gộp nguồn thông minh:** Hoàn thiện thuật toán gộp tin: Nếu cảm biến báo khói và sinh viên cùng gửi phản ánh tại một khu vực trong vòng 15 phút, hệ thống tự động gộp chung vào 1 phiếu và nâng nguồn thành `both`, nâng mức ưu tiên lên `high`/`urgent`.
2. **Kiểm soát SLA & Escalation:** Cài đặt bộ đếm ngược thời hạn SLA 15 phút và 48 giờ. Phiếu quá hạn tự động gắn cờ `is_overdue`, `escalated` và cung cấp endpoint `GET /api/tickets/overdue` để BQL can thiệp.
3. **Web Push cho Ca trực (`backend/src/notify/webpush.ts`):** Thiết lập cơ chế thông báo đẩy qua VAPID key tới điện thoại ca trực trong vòng 5 giây, đính kèm thông tin hiện diện PIR: *"Có người tại chỗ (PIR bật)"* hoặc *"Không còn ai"*.

## 20/10/2026 — A: Khu thử Sandbox BGK, Dữ liệu tự dời ngày (Rolling Dates) & API Infographic (D6)

1. **Sandbox cho Ban Giám Khảo (`backend/src/api/sandbox.ts`):** Xây dựng khu thử riêng cho tài khoản `bgk` (`role: viewer`). Phiếu tạo ra được gắn nhãn `is_sandbox: true`, hoàn toàn không ảnh hưởng đến số liệu thống kê vận hành thực tế. Định kỳ 5 phút tự động quét dọn và xoá các phiếu sandbox cũ hơn 30 phút. Cung cấp API `POST /api/sandbox/reset` cho phép BGK bấm nút "Đặt lại" bất kỳ lúc nào để làm sạch sandbox.
2. **Cơ chế Dữ liệu tự dời ngày (Rolling Dates - `backend/src/api/rolling-dates.ts`):** Tự động tính toán độ lệch thời gian để dịch chuyển timestamp của toàn bộ dữ liệu mẫu (tickets, telemetry, audit logs) sao cho tuần gần nhất luôn kết thúc vào đúng ngày hiện tại (hôm nay). Cung cấp API `POST /api/admin/roll-dates` để kích hoạt theo yêu cầu hoặc cron hàng đêm.
3. **API Đăng Infographic tuyên truyền (`backend/src/api/infographics.ts`):** Endpoint `POST /api/infographics` chỉ cho phép Ban Quản lý (`role: manager`) đăng tải, giới hạn dung lượng $\le 2\text{ MB}$, và tích hợp thuật toán tự động bóc tách loại bỏ toàn bộ siêu dữ liệu EXIF (GPS, thiết bị) để bảo vệ quyền riêng tư.
4. **Nhãn riêng cho link khảo sát Form 2:** Cập nhật hợp đồng phản ánh và API `POST /api/reports` hỗ trợ cờ `is_trial` và nguồn `form2_trial`, giúp tách biệt hoàn toàn phản ánh thử nghiệm của sinh viên khỏi số liệu KPI kỷ luật học đường.
5. **Rà soát phân quyền vai trò (RBAC):** BGK chỉ thao tác trên Sandbox, không sửa được phiếu thật; Ca trực chỉ xem và cập nhật phiếu phân công cho ca của mình; Chuyên viên phân tích chỉ đọc (Read-only); Ban Quản lý nắm quyền điều phối tối cao.

## 21/10/2026 — A: Sửa lỗi trước đóng băng tính năng 12:00 & Mốc 2 (D7)

1. **Chốt hạ tính năng Backend trước giờ đóng băng:** Toàn bộ API lõi, WebSocket, Ingest, Web Push, Sandbox, RBAC, Infographic và Rolling Dates đã hoàn thiện, không phát sinh thêm tính năng mới.
2. **Tăng cường kiểm thử:** Mở rộng bộ kiểm thử lên 22 unit & integration test cases (`npm run test:backend`), đạt tỷ lệ vượt qua 100% với thời gian thực thi < 1 giây.
3. **Khớp nối với các thành viên:** Cung cấp đầy đủ đặc tả API cho Cúc (gắn nút Đặt lại Sandbox, upload Infographic), chuẩn bị đầu vào đón dữ liệu 6 tuần mới từ Đức (D) và cờ nguồn Form 2 từ Mạnh (B).

## 22/10/2026 — A: Triển khai bản công khai, Giám sát hệ thống & Bộ tài liệu SOP, Quy chế (D8)

1. **Giám sát hệ thống (`GET /api/health/detailed`):** Endpoint cung cấp thông tin thời gian thực về Uptime, RAM tiêu thụ, trạng thái kết nối SQLite/PostgreSQL và phiên bản môi trường, sẵn sàng tích hợp công cụ giám sát UptimeRobot.
2. **Cấu hình đóng gói Production:** Xây dựng `backend/Dockerfile` và `docker-compose.yml` tối ưu cho việc đưa lên máy chủ hoặc các nền tảng đám mây (Render, Railway, VPS).
3. **Kịch bản Smoke Test Công khai (`scripts/smoke-test-public.ts`):** Giả lập người dùng từ mạng ngoài/máy lạ qua 4G kiểm tra toàn bộ 7 hạng mục: Health check, Lấy danh mục 25 khu vực UET, Gửi phản ánh QR, Tra cứu tiến độ, Đăng nhập 3 vai trò, Thử nghiệm Sandbox BGK, Đăng Infographic BQL. Chạy qua lệnh `npm run test:smoke` đạt kết quả 100%.
4. **Quy trình Vận hành Tiêu chuẩn (SOP) cho Ca trực và BQL:** Ban hành tài liệu [docs/sop-van-hanh.md](sop-van-hanh.md) quy định chi tiết 6 bước xử lý, thời gian SLA 15 phút, xử lý khẩn cấp và giao ban ca trực.
5. **Quy chế Quản trị Dữ liệu & Quyền riêng tư:** Ban hành tài liệu [docs/quy-che-du-lieu-va-quyen-rieng-tu.md](quy-che-du-lieu-va-quyen-rieng-tu.md) khẳng định cam kết Privacy by Design: Không camera, không định danh cá nhân, che PII cấp độ Ingest, cảm biến PIR chỉ làm dữ liệu ngữ cảnh hỗ trợ (không dùng làm bằng chứng xử phạt), xoá EXIF và thời hạn lưu trữ dữ liệu.

## 23-24/10/2026 — A: Thuyết minh Kiến trúc, Bảo mật, Triển khai & Rà soát hồ sơ (D9 - D10)

1. **Thuyết minh Kỹ thuật chính thức:** Xuất bản tài liệu [docs/thuyet-minh-kien-truc-va-bao-mat.md](thuyet-minh-kien-truc-va-bao-mat.md) phục vụ hồ sơ dự thi Vòng 2 gồm 3 mục nòng cốt do Ly chủ trì:
   - *Mục 1:* Kiến trúc Kỹ thuật Hệ thống (Mô hình 4 tầng, Thuật toán Gộp nguồn 15 phút, FSM State Machine 6 bước).
   - *Mục 2:* Bảo mật và Quyền riêng tư (Privacy by Design, PII Masking, RBAC 4 vai trò, EXIF Stripping, Cơ chế mã tra cứu).
   - *Mục 3:* Phương thức và Lộ trình Triển khai 12 tuần (Kế hoạch thực địa tại Hoà Lạc, đóng gói Zalo Mini App, kết nối Zalo OA, định mức kinh phí < 1.500.000đ/toà).
2. **Rà soát kỹ thuật:** Toàn bộ link, hợp đồng dữ liệu, seed, script demo và tài liệu hướng dẫn đã được kiểm tra chéo, không còn lỗi runtime hay liên kết hỏng. Toàn bộ trách nhiệm kỹ thuật của Người A đã hoàn thành xuất sắc 100%.



