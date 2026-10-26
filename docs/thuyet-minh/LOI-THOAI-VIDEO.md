# Lời thoại video demo — VNU SmarT-Free Zone

Dài khoảng 4 phút 20 giây, 8 phân đoạn theo mục 9 của kế hoạch. Người viết: C. Người duyệt: E.

**Quy ước khi quay và dựng**

- Tốc độ đọc khoảng 130 chữ/phút; mỗi phân đoạn đã tính số chữ cho vừa thời lượng.
- Cảnh nào dùng dữ liệu giả lập thì để nhãn **"Dữ liệu mô phỏng"** ở góc màn hình suốt cảnh đó.
- Không quay mặt người, không quay tên hay số phòng thật.
- Địa điểm kịch bản: **UET1-3CT, chiếu nghỉ thang bộ tầng 3, nhà UET1** (danh mục khu vực đã chuyển từ KTX giả lập sang khuôn viên UET Hoà Lạc; "B5-CTD" trong kế hoạch gốc nay là UET1-3CT).
- Con số nào đọc trong video phải có trong cột **Nguồn**; E kiểm tra trước khi thu âm. Không đọc số liệu AI và độ trễ cho tới khi các số đó được tính lại từ dữ liệu (xem [rà soát kỹ thuật](../ra-soat-ky-thuat-2026-10-26.md)).

---

## 1. Mở đầu — 0:00–0:20

**Hình:** cầu thang, hành lang vắng; chữ chạy một con số từ Form 1.

**Lời:**
> Mười giờ tối, chiếu nghỉ cầu thang. Mùi khói thuốc lan sang hành lang, sang phòng bên cạnh. Nhiều bạn sinh viên ngửi thấy, nhưng ít ai lên tiếng: sợ lộ danh tính, và nghĩ báo cũng chẳng ai tới kịp.

| Con số trên màn hình | Nguồn |
| :--- | :--- |
| Tỉ lệ SV e ngại lộ danh tính khi phản ánh | Báo cáo Form 1, Phát hiện 2 ([form1-khao-sat-nhu-cau.md](../reports/form1-khao-sat-nhu-cau.md)) |

## 2. "22:10, UET1-3CT" — 0:20–1:30

**Hình (máy tính, quay 1080p):** Wokwi — vặn biến trở, bấm PIR, Serial Monitor in bản tin → dashboard: khu vực UET1-3CT chuyển màu nghi vấn, banner phiếu mới. **Hình (máy thứ hai quay điện thoại):** thông báo đẩy "Có người tại chỗ" hiện trên màn hình khoá. **Hình:** điện thoại SV quét QR, chọn "Đang có người hút", gửi; trên dashboard phiếu được gộp, nguồn tin đổi thành "Cả hai nguồn".

**Lời:**
> Hệ thống bắt đầu từ một cảm biến nhỏ. Mạch ESP32 đo bụi mịn, nhiệt độ, độ ẩm, và một cảm biến hiện diện chỉ biết có người hay không — không camera, không micro.
>
> Khi nồng độ bụi mịn tăng vọt so với mức bình thường của chính khu vực đó, hệ thống gắn cờ nghi vấn. Ban quản lý thấy ngay trên sơ đồ, và điện thoại phòng trực nhận cảnh báo: "Có người tại chỗ".
>
> Cùng lúc, một bạn sinh viên quét mã QR dán ở cầu thang. Vị trí đã được điền sẵn; bạn chỉ chọn hiện tượng và bấm gửi, không cần tên, không cần đăng nhập. Hai nguồn tin cùng khu vực trong mười lăm phút được gộp thành một phiếu, và phiếu được nâng mức ưu tiên.

## 3. Xử lý khép kín — 1:30–2:10

**Hình:** điện thoại ca trực bấm "Đang đến", "Đã đến", trả lời nhanh 3 câu xác minh → dashboard: chi tiết phiếu, lịch sử từng bước → BQL gửi phản hồi → điện thoại SV nhập mã tra cứu, thấy bước "Đã phản hồi".

**Lời:**
> Cán bộ trực bấm "Đang đến", rồi "Đã đến" — thời điểm có mặt được ghi lại để đo hạn mười lăm phút. Ba câu xác minh nhanh: còn mùi không, có tàn thuốc không, có thấy người hút không. Không có ô nào để ghi tên người vi phạm.
>
> Phiếu đi đủ sáu bước, không bước nào bị bỏ qua. Người phản ánh nhập mã tra cứu và thấy phản ánh của mình đã được xử lý.

## 4. Phòng ngừa & Hỗ trợ — 2:10–2:50

**Hình:** bản đồ nhiệt khu vực × giờ, bật/tắt "nghi vấn / đã xác nhận" → tab Dự báo & tuần tra → tab Báo cáo tuần → BQL đăng infographic, infographic hiện ở Tổng quan → điện thoại SV mở "Hỗ trợ cai thuốc".

**Lời:**
> Mỗi phiếu đóng lại trở thành dữ liệu để phòng ngừa. Bản đồ nhiệt cho thấy khu vực nào, giờ nào hay có khói. Hệ thống gợi ý lịch tuần tra cho tuần tới và soạn báo cáo tuần cho ban quản lý. Ban quản lý đăng infographic đúng vào toà đang là điểm nóng.
>
> Với bạn đang hút thuốc, ứng dụng có một lối đi riêng, không phán xét: kế hoạch cai, bài tập vượt cơn thèm, và tổng đài miễn phí 1800 6606.

## 5. Bên trong hệ thống — 2:50–3:20

**Hình:** terminal chạy bộ giả lập 10 cảm biến → trang Minh bạch thuật toán (lướt qua, không zoom vào con số).

**Lời:**
> Vì chưa lắp thiết bị thật, đội xây bộ giả lập mười cảm biến với sáu loại sự kiện: thuốc lá điếu, thuốc lá điện tử, hơi nước nhà tắm, bụi quét dọn, ô nhiễm ngoài trời và bình xịt. Trang Minh bạch thuật toán công khai cách đánh giá: bắt đúng bao nhiêu, báo nhầm bao nhiêu, hay nhầm loại nào — luôn ghi rõ là trên dữ liệu mô phỏng.

## 6. Bằng chứng thật — 3:20–3:45

**Hình:** biểu đồ Form 1 và Form 2 (B cung cấp).

**Lời:**
> Hai khảo sát với sinh viên thật: một về nhu cầu, một sau khi các bạn tự dùng thử ứng dụng — đo độ dễ dùng theo thang SUS và thời gian gửi một phản ánh.

| Con số trên màn hình | Nguồn |
| :--- | :--- |
| Số người trả lời Form 1 | [form1-khao-sat-nhu-cau.md](../reports/form1-khao-sat-nhu-cau.md) |
| Điểm SUS đợt 1 → đợt 2, thời gian gửi trung vị | [form2-dung-thu-va-sus.md](../reports/form2-dung-thu-va-sus.md) |

## 7. Nhân rộng — 3:45–4:05

**Hình:** clip của B — thêm toà mới, in hàng loạt poster QR, có đồng hồ bấm giờ.

**Lời:**
> Mở rộng sang toà nhà mới chỉ mất vài phút: thêm khu vực, in mã QR, dán lên tường. Ứng dụng sinh viên đã tách lớp nền tảng để chuyển sang Zalo Mini App, và firmware sẵn sàng nạp vào thiết bị thật.

## 8. Kết — 4:05–4:20

**Hình:** sơ đồ 4 lớp: Phát hiện · Phản hồi · Phòng ngừa · Hỗ trợ; logo đội.

**Lời:**
> Phát hiện sớm, phản hồi đúng người, phòng ngừa chủ động, hỗ trợ không phán xét. VNU SmarT-Free Zone — cùng nhau giữ một bầu không khí sạch.

---

## Danh sách cảnh cần quay (sau 12:00 D8)

| # | Cảnh | Thiết bị | Ai chuẩn bị |
| :--- | :--- | :--- | :--- |
| 1 | Cầu thang, hành lang (không người) | Điện thoại | C |
| 2a | Wokwi: vặn biến trở, bấm PIR, Serial Monitor | OBS 1080p | D |
| 2b | Dashboard: khu vực đổi màu, banner phiếu mới | OBS 1080p | C |
| 2c | Điện thoại ca trực nhận thông báo đẩy | Máy thứ hai quay | C |
| 2d | SV quét QR, gửi phản ánh; phiếu gộp trên dashboard | Máy thứ hai + OBS | B, C |
| 3 | Ca trực 3 nút, chi tiết phiếu, SV tra cứu | Máy thứ hai + OBS | C |
| 4 | Bản đồ nhiệt, dự báo, báo cáo tuần, đăng infographic, Hỗ trợ cai thuốc | OBS + điện thoại | C, E |
| 5 | Bộ giả lập, trang Minh bạch | OBS | D, E |
| 6 | Biểu đồ Form 1, Form 2 | Ảnh xuất | B |
| 7 | Thêm toà + in QR có bấm giờ | Clip của B | B |
| 8 | Sơ đồ 4 lớp | Ảnh tĩnh | E |

Mỗi cảnh quay 2 lần. Chạy `npm run demo:m1` để dựng lại kịch bản UET1-3CT trước mỗi lần quay cảnh 2–3.
