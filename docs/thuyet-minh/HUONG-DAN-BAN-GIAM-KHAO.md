# TÀI LIỆU HƯỚNG DẪN TRẢI NGHIỆM DÀNH CHO BAN GIÁM KHẢO
### HỆ THỐNG VNU SMART-FREE ZONE (ĐỘI BND)
---

Kính gửi Quý Ban Giám khảo cuộc thi **"Sáng tạo vì một thế hệ không khói thuốc"**,

Đội BND đã chuẩn bị sẵn môi trường trải nghiệm hoàn chỉnh (Live Demo) kèm chế độ **Sandbox chuyên biệt dành cho Ban Giám khảo**. Quý Giám khảo có thể tự do thao tác, gửi phản ánh, chuyển trạng thái phiếu và chạy các kịch bản thử nghiệm mà **hoàn toàn không làm ảnh hưởng đến dữ liệu chính của hệ thống**.

---

## I. THÔNG TIN CÁC ĐƯỜNG DẪN & TÀI KHOẢN TRUY CẬP

### 1. Các đường dẫn ứng dụng
- **Ứng dụng Sinh viên (Quét QR & Hỗ trợ cai thuốc):** [http://127.0.0.1:5174](http://127.0.0.1:5174)
- **Dashboard Quản lý & Ca trực:** [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **Tài liệu API tương tác (Swagger UI):** [http://127.0.0.1:3001/docs](http://127.0.0.1:3001/docs)
- **Dự án Mạch Mô phỏng Wokwi ESP32:** [https://wokwi.com/projects/478273736679993345](https://wokwi.com/projects/478273736679993345)

### 2. Danh sách tài khoản thử nghiệm theo 4 vai trò
| Vai trò | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn đặc thù |
| :--- | :--- | :--- | :--- |
| **Ban Giám khảo (Sandbox)** | `bgk` | `Demo@2026` | Toàn quyền chạy thử kịch bản trong Sandbox; phiếu tự xoá sau 30 phút hoặc khi bấm nút "Đặt lại". |
| **Ban Quản lý (Manager)** | `bql` | `Demo@2026` | Xem toàn bộ phiếu, điều phối ca trực, đăng tải infographic tuyên truyền, xem KPI và báo cáo tuần. |
| **Phòng trực toà UET1** | `trucuet1` | `Demo@2026` | Màn hình ca trực 3 nút ("Đang đến / Đã đến / Báo nhầm") dành riêng cho cán bộ toà UET1. |
| **Phòng Bảo vệ 24/7** | `baove` hoặc `catruc` | `Demo@2026` | Xử lý các sự cố khẩn cấp, tuần tra đêm và giám sát Nhà đa năng, các cổng trường. |
| **Chuyên viên Phân tích** | `phantich` | `Demo@2026` | Quyền xem số liệu phân tích, xuất báo cáo tuần và kiểm tra ma trận minh bạch thuật toán. |

---

## II. QUY TRÌNH 3 BƯỚC TRẢI NGHIỆM TRỌN VẸN HỆ THỐNG TRONG 5 PHÚT

### Bước 1: Trải nghiệm luồng Sinh viên (Phản ánh & Hỗ trợ cai thuốc)
1. Mở đường dẫn giả lập quét mã QR tại chiếu nghỉ toà UET1:  
   👉 **`http://127.0.0.1:5174/?zone=UET1-3CT`**
2. Ứng dụng tự động nhận diện vị trí *"Chiếu nghỉ thang bộ F3 UET1"*.
3. Chọn loại hiện tượng (Thuốc lá điếu hoặc Pod/Vape), tích chọn *"Đang diễn ra"* và bấm **"GỬI PHẢN ÁNH ẨN DANH (≤ 30s)"**.
4. Màn hình hiện thông báo chúc mừng kèm **Mã tra cứu ngẫu nhiên** (VD: `K7Q2-9XMA`). Bấm *"Sao chép mã"*.
5. Bấm chuyển sang tab **"Cai thuốc"** để trải nghiệm:
   - Bấm nút **"BẮT ĐẦU VƯỢT CƠN THÈM (3 PHÚT)"** để xem vòng tròn hướng dẫn nhịp thở 4-7-8 giúp cắt cơn thèm tức thời.
   - Bấm vào tab **"Đo mức nghiện"** để làm bài test Fagerström 6 câu chuẩn y khoa.

### Bước 2: Trải nghiệm luồng Điều phối & Ca trực xử lý 6 bước
1. Mở cửa sổ trình duyệt thứ hai tại:  
   👉 **`http://127.0.0.1:5173`**
2. Đăng nhập tài khoản `bql` / `Demo@2026`.
3. Quan sát trang **Tổng quan**: Phiếu phản ánh vừa gửi ở Bước 1 xuất hiện tức thì nhờ Socket.IO (không cần tải lại trang).
4. Vào mục **"Điều phối"**: BQL chọn chuyển phiếu cho *"Phòng trực UET1"* kèm đồng hồ đếm ngược hạn nhận việc 3 phút.
5. Đăng xuất và đăng nhập tài khoản cán bộ trực `trucuet1` / `Demo@2026` (hoặc mở trên điện thoại):
   - Thấy ngay phiếu được giao.
   - Bấm **"Đang đến"** (Hệ thống ghi nhận thời gian tiếp nhận).
   - Bấm **"Đã đến"** (Hệ thống ghi nhận thời gian có mặt tại hiện trường).
   - Chọn nhanh câu hỏi xác minh: *"Còn mùi khói? - Có | Có người tại chỗ? - Có"* và bấm hoàn tất.
6. Quay lại App sinh viên ở Bước 1, nhập mã tra cứu `K7Q2-9XMA` để thấy tiến độ 6 bước được cập nhật minh bạch kèm lời cảm ơn của Nhà trường.

### Bước 3: Trải nghiệm Trung tâm Phân tích AI & Minh bạch Thuật toán
1. Trên Dashboard, bấm vào mục **"Phân tích"** (`/analytics`):
   - **Tab Dự báo điểm nóng & Tuần tra:** Xem biểu đồ mô phỏng độ phủ tăng từ 38.5% lên **84.6%** và lịch 6 ca tuần tra gợi ý cho 4 toà UET.
   - **Tab Minh bạch thuật toán (AI Transparency):** Kiểm tra ma trận nhầm lẫn (Confusion Matrix), chỉ số Precision/Recall cho 6 loại sự kiện khí dung và kết quả 3 bài kiểm tra độ bền (Stress Tests).
   - **Tab Báo cáo tuần AI:** Xem văn bản báo cáo tuần tự động tổng hợp chỉ số SLA và đề xuất hành động cho Lãnh đạo Nhà trường.
   - **Tab Khung Infographic Tuyên truyền:** BQL có thể bấm *"Đăng Infographic"* để tải lên ấn phẩm tuyên truyền (hệ thống tự động lọc bỏ siêu dữ liệu định vị EXIF).

---

## III. THỬ NGHIỆM KỊCH BẢN PHẦN CỨNG ESP32 TRÊN WOKWI
1. Mở liên kết Wokwi: [https://wokwi.com/projects/478273736679993345](https://wokwi.com/projects/478273736679993345)
2. Bấm nút **Play (▶)** màu xanh lá để khởi động vi điều khiển ESP32.
3. Kéo thanh trượt của **Biến trở (Potentiometer)** lên cao để mô phỏng khói thuốc vượt ngưỡng:
   - Còi chíp Buzzer trên mạch sẽ kêu cảnh báo tại chỗ.
   - Cảm biến chuyển động PIR bật nhận diện có người tại chỗ.
   - Ngay lập tức trên Dashboard Admin xuất hiện cảnh báo đỏ và Web Push được gửi tới ca trực với nội dung: *"🚨 CẢNH BÁO KHÓI THUỐC PHÁT HIỆN QUA CẢM BIẾN | Hiện diện: Có người tại chỗ (PIR bật)"*.

Chúc Quý Ban Giám khảo có những phút giây trải nghiệm ấn tượng và đánh giá cao tính hoàn thiện của giải pháp VNU SmarT-Free Zone!
