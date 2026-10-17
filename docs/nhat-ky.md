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

