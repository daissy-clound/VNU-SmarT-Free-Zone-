# HƯỚNG DẪN TRẢI NGHIỆM DÀNH CHO BAN GIÁM KHẢO

### VNU SmarT-Free Zone — Đội BND

Kính gửi Ban Giám khảo cuộc thi **"Sáng tạo vì một thế hệ không khói thuốc"**,

Tài khoản BGK làm việc trong **khu thử (sandbox)**: phiếu do BGK tạo không lẫn vào số liệu vận hành, tự xoá sau 30 phút, và có nút **Đặt lại**. Mọi trang dùng dữ liệu giả lập đều gắn nhãn **"Dữ liệu mô phỏng"**.

---

## I. Đường dẫn và tài khoản

> A điền link chính thức trước khi xuất PDF (mục 9 của kế hoạch). Khi chạy cục bộ: app SV `http://127.0.0.1:5174`, dashboard `http://127.0.0.1:5173`, API `http://127.0.0.1:3001/docs`.

| Thành phần | Đường dẫn |
| :--- | :--- |
| Ứng dụng sinh viên (quét QR, tra cứu, hỗ trợ cai thuốc) | `<LINK_APP_SV>` |
| Dashboard quản lý và màn hình ca trực | `<LINK_DASHBOARD>` |
| Mạch ESP32 mô phỏng trên Wokwi | https://wokwi.com/projects/478273736679993345 |
| Video demo (YouTube, không công khai) và bản dự phòng (Drive) | `<LINK_YOUTUBE>` · `<LINK_DRIVE>` |

| Vai trò | Tài khoản | Dùng để |
| :--- | :--- | :--- |
| Ban Giám khảo | `bgk` | Chạy kịch bản trong khu thử, xem mọi trang phân tích |
| Ca trực (điện thoại) | `trucuet1` | Bật thông báo đẩy, xem màn hình 3 nút |

Mật khẩu được gửi kèm hồ sơ (đổi sau giai đoạn phát triển).

---

## II. Ba bước trải nghiệm (khoảng 5 phút)

### Bước 1 — Chạy kịch bản trên dashboard

1. Mở dashboard, đăng nhập `bgk`.
2. Ở trang **Tổng quan**, khung **Khu thử của Ban Giám khảo**: chọn khu vực rồi bấm **Chạy kịch bản**. Hệ thống tạo một phiếu như khi cảm biến báo khói và sinh viên phản ánh cùng lúc.
3. Bấm vào mã phiếu (dạng `SF-SBX-…`) và bấm lần lượt **Đang đến → Đã đến** (trả lời nhanh: còn mùi? có tàn thuốc? thấy người hút?) **→ Đã xử lý → Phản hồi → Đóng phiếu**. Phiếu đi đủ 6 bước, không nhảy cóc; chỉ những nút hợp lệ ở bước hiện tại mới hiện ra, và không có ô ghi tên người vi phạm.
4. Bấm **Đặt lại** khi xong. Dữ liệu vận hành không thay đổi.

### Bước 2 — Gửi phản ánh như một sinh viên

1. Mở `<LINK_APP_SV>/?zone=UET1-3CT` (tương đương quét mã QR dán ở chiếu nghỉ thang bộ tầng 3, nhà UET1). Vị trí được điền sẵn.
2. Chọn hiện tượng, bấm **Gửi phản ánh**. Ứng dụng trả về **mã tra cứu** ngẫu nhiên.
3. Mở tab **Tra cứu**, nhập mã để thấy phiếu đang ở bước nào và lời phản hồi của nhà trường (không hiện tên cán bộ).
4. Nút đỏ **Khẩn cấp (cháy, có người ngất)** có bước xác nhận và nút gọi 114/115. Vui lòng không bấm khi thử trên link chính thức.
5. Tab **Hỗ trợ** tách riêng khỏi phản ánh: kiến thức ngắn, hỗ trợ cai thuốc, tổng đài 1800.6606.

### Bước 3 — Xem cách AI được đánh giá

Vào **Phân tích** trên dashboard:

- **Minh bạch thuật toán:** tập dữ liệu dùng để đánh giá, chỉ số theo từng loại sự kiện, ma trận nhầm lẫn, kiểm tra độ bền. Kết quả trên dữ liệu mô phỏng, chưa phải số đo tại toà nhà thật.
- **Dự báo & tuần tra:** khu vực và khung giờ có nguy cơ cao, lịch tuần tra gợi ý.
- **Báo cáo tuần** và **Khung infographic** của Ban quản lý.

---

## III. (Tuỳ chọn) Nhận cảnh báo trên điện thoại

1. Trên điện thoại, mở dashboard và đăng nhập `trucuet1`.
2. iPhone: bấm Chia sẻ → **Thêm vào Màn hình chính**, rồi mở app từ màn hình chính (iOS chỉ cho phép thông báo đẩy với web app đã cài).
3. Trong màn hình **Phòng trực**, bấm **Bật thông báo**, rồi **Gửi thử**. Bấm vào thông báo để mở thẳng phiếu.

---

## IV. Mạch ESP32 trên Wokwi

1. Mở link Wokwi, bấm **▶** để chạy.
2. Kéo **biến trở** (đóng vai cảm biến bụi) lên cao, bấm **cảm biến PIR** để giả lập có người: còi trên mạch kêu, Serial Monitor in bản tin JSON gửi mỗi 5 giây theo đúng mẫu dữ liệu của hệ thống (có giờ đo `ts`, cờ `late` khi gửi bù sau mất mạng).
3. Mạch Wokwi gửi lên kênh MQTT demo công khai, không chứa mật khẩu thật. Luồng tới dashboard trong buổi chấm do bộ giả lập 10 cảm biến trên máy chủ đảm nhiệm.
