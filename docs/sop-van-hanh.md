# QUY TRÌNH VẬN HÀNH TIÊU CHUẨN (SOP)
## HỆ THỐNG GIÁM SÁT & TIẾP NHẬN BÁO CÁO VNU SMART-FREE ZONE
**Áp dụng:** Khuôn viên Trường Đại học Công nghệ (UET) — ĐHQGHN tại Hoà Lạc  
**Phiên bản:** SOP-SFZ-2026-v2.0  
**Tác giả chủ trì:** Ly (Thành viên A — Trưởng kỹ thuật & Backend)  
**Phê duyệt ban hành:** Ban Quản lý Dự án & Đội Tự quản / Ca trực An ninh ĐHQGHN  

---

### I. MỤC TIÊU VÀ NGUYÊN TẮC VẬN HÀNH
1. **Mục tiêu:** Đảm bảo mọi dấu hiệu khói thuốc (từ cảm biến IoT hoặc phản ánh của sinh viên) được xử lý nhanh chóng, minh bạch, đúng thẩm quyền và giải quyết triệt để trong thời gian chuẩn cam kết (SLA).
2. **Cam kết SLA (Service Level Agreement):**
   - **Thời gian tiếp nhận và phân công:** $\le 3$ phút kể từ khi hệ thống ghi nhận.
   - **Thời gian có mặt tại hiện trường (Xác minh):** $\le 15$ phút đối với sự cố thông thường; $\le 5$ phút đối với sự cố Khẩn cấp (`emergency`).
   - **Thời gian phản hồi thông tin cho người báo:** Trong vòng 30 phút sau khi xử lý xong hiện trường.
3. **Nguyên tắc bảo vệ riêng tư:** Ca trực và Ban Quản lý không truy tìm danh tính người phản ánh; thông tin sinh viên gửi đến đều được mã hoá và cấp mã tra cứu ẩn danh. Cảm biến hiện diện PIR chỉ dùng làm dữ liệu ngữ cảnh hỗ trợ, không dùng làm bằng chứng xử phạt đơn lẻ.

---

### II. QUY TRÌNH XỬ LÝ 6 BƯỚC CHI TIẾT

```
  [1. Tiếp nhận]  --->  [2. Phân công]  --->  [3. Tiếp cận / Xác minh]
   (received)            (assigned)                (verifying)
                                                        |
                                                        v
  [6. Đóng phiếu] <---  [5. Phản hồi]  <---  [4. Xử lý hiện trường]
    (closed)             (responded)                (handled)
```

#### Bước 1: Tiếp nhận thông tin (Trạng thái: `received`)
- **Nguồn kích hoạt:**
  - *Cảm biến:* Nút IoT phát hiện $PM_{2.5} \ge 35\ \mu g/m^3$, độ ẩm phù hợp, tự động mở phiếu trong 5 giây.
  - *Sinh viên:* Quét mã QR tại khu vực (hoặc link dùng thử Form 2), gửi phản ánh với mã tra cứu ngẫu nhiên (VD: `K7Q2-9XMA`).
  - *Gộp nguồn tự động:* Nếu trong vòng 15 phút, cùng một khu vực vừa có cảm biến kích hoạt vừa có sinh viên báo tin, hệ thống tự động gộp thành 1 phiếu chung mang nguồn `both` và nâng ưu tiên lên mức `high` hoặc `urgent`.
- **Hành động hệ thống:** Phát tín hiệu Web Push khẩn cấp đến thiết bị di động của thành viên ca trực đang trong ca làm việc.

#### Bước 2: Tiếp nhận và Phân công (Trạng thái: `assigned`)
- **Người thực hiện:** Trưởng ca trực an ninh hoặc Hệ thống tự động phân công theo lịch tuần tra.
- **Thao tác:** Bấm nút "Nhận nhiệm vụ" trên Màn hình Ca trực PWA. Phiếu chuyển sang `assigned`, đồng hồ đếm ngược SLA 15 phút bắt đầu hiển thị cảnh báo trực quan.

#### Bước 3: Tiếp cận hiện trường & Xác minh (Trạng thái: `verifying`)
- **Người thực hiện:** Cán bộ ca trực được phân công.
- **Thời hạn:** Có mặt tại toà nhà/vị trí được chỉ định trong vòng **15 phút**.
- **Thao tác:** Khi tới nơi, nhân viên bấm "Bắt đầu kiểm tra" trên app di động để hệ thống ghi nhận mốc thời gian tiếp cận thực tế (`verifying`).
- **Lưu ý kiểm soát SLA:** Nếu sau 15 phút kể từ khi mở phiếu mà chưa có ai bấm xác minh, hệ thống tự động gắn cờ `is_overdue = true`, nâng mức ưu tiên lên `urgent` và gửi tin nhắn cảnh báo chuyển cấp (Escalation) thẳng đến tài khoản của Ban Quản lý (`bql`).

#### Bước 4: Xử lý tại hiện trường (Trạng thái: `handled`)
- **Người thực hiện:** Cán bộ ca trực tại hiện trường.
- **Hành động thực tế:**
  - Nhắc nhở người có hành vi hút thuốc dập thuốc ngay lập tức.
  - Tuyên truyền về quy định khuôn viên UET / KTX không khói thuốc và giới thiệu kênh hỗ trợ cai thuốc.
  - Trường hợp cố tình vi phạm nhiều lần: Lập biên bản sự việc và ghi nhận theo quy chế của ĐHQGHN.
- **Thao tác trên app:** Bấm "Đã xử lý xong", nhập ngắn gọn nội dung xử lý (VD: *"Đã nhắc nhở 2 người tại chân cầu thang toà UET1 rời đi, khu vực đã thông thoáng"*).

#### Bước 5: Ban Quản lý phê duyệt phản hồi (Trạng thái: `responded`)
- **Người thực hiện:** Ban Quản lý (`role: manager`).
- **Thẩm quyền:** Chỉ BQL mới có quyền duyệt nội dung thông điệp gửi về mã tra cứu của sinh viên (ca trực không được tự ý duyệt bước này để đảm bảo chuẩn mực ngôn từ và văn hoá học đường).
- **Hành động:** Kiểm tra báo cáo của ca trực, chỉnh sửa thông điệp cảm ơn nếu cần và bấm "Phê duyệt phản hồi".
- **Kết quả:** Sinh viên khi mở điện thoại tra cứu mã `K7Q2-9XMA` sẽ thấy ngay trạng thái *"Đã phản hồi"* cùng lời cảm ơn chính thức từ Ban Quản lý.

#### Bước 6: Đóng phiếu & Lưu trữ (Trạng thái: `closed`)
- **Người thực hiện:** Ban Quản lý (`role: manager`).
- **Thao tác:** Đóng phiếu để hoàn tất vòng đời sự cố. Số liệu được tổng hợp vào bảng phân tích thống kê điểm nóng và cập nhật vào mô hình AI gợi ý lịch tuần tra cho tuần tiếp theo.

---

### III. QUY TRÌNH XỬ LÝ TÌNH HUỐNG ĐẶC BIỆT

#### 1. Sự cố Khẩn cấp (`emergency: true`)
- Được kích hoạt khi sinh viên bấm nút "Báo khẩn cấp" (nguy cơ cháy nổ, tụ tập hút thuốc trái phép quy mô lớn, tranh chấp xô xát).
- Độ ưu tiên lập tức đặt là `urgent`, SLA tiếp cận rút ngắn xuống **5 phút**.
- Còi chuông cảnh báo trên Dashboard trực ban reo liên tục cho đến khi trưởng ca trực tiếp nhận.

#### 2. Xử lý trường hợp báo sai / Báo thử nghiệm (Sandbox & Form 2)
- **Tài khoản Ban Giám Khảo (`bgk`):** Thao tác trong không gian Sandbox riêng. Phiếu tự động xoá sau 30 phút hoặc khi BGK bấm nút "Đặt lại". Ca trực thật không bị điều động nhầm.
- **Dữ liệu khảo sát Form 2:** Mang cờ `is_trial: true`, được tách riêng trên giao diện để phục vụ nghiên cứu và đánh giá trải nghiệm người dùng, không tính vào KPI vi phạm thực tế của các khoa/toà nhà.

---

### IV. BÀN GIAO CA TRỰC VÀ BÁO CÁO ĐỊNH KỲ
1. **Giao nhận ca trực (Hàng ngày):**
   - Ca trước và ca sau kiểm tra trên Dashboard: đảm bảo không còn phiếu nào ở trạng thái `received` hoặc `assigned` chưa có người giải quyết.
   - Bàn giao danh sách các "điểm nóng" cần tăng cường tuần tra trong ngày (dựa theo đề xuất từ tab Dự báo của hệ thống).
2. **Báo cáo định kỳ:**
   - Mỗi sáng thứ Hai, Ban Quản lý xuất báo cáo tổng hợp tuần (tỷ lệ giải quyết đúng hạn SLA, thời gian phản ứng trung bình, các khu vực vi phạm giảm dần) để tuyên truyền trên bảng tin và đăng infographic cổ động.
