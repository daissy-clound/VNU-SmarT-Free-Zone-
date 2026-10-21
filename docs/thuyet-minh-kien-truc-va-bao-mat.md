# THUYẾT MINH KỸ THUẬT: KIẾN TRÚC, BẢO MẬT & LỘ TRÌNH TRIỂN KHAI
## DỰ ÁN: VNU SMART-FREE ZONE — ĐHQGHN TẠI HOÀ LẠC
**Tác giả chủ trì:** Ly (Thành viên A — Trưởng kỹ thuật & Kiến trúc hệ thống)  
**Đóng góp vào hồ sơ dự thi Vòng 2:** Đội BND  

---

### MỤC 1: KIẾN TRÚC KỸ THUẬT HỆ THỐNG (SYSTEM ARCHITECTURE)

#### 1.1. Mô hình tổng thể 4 tầng (4-Tier Modular Architecture)
Hệ thống VNU SmarT-Free Zone được thiết kế theo kiến trúc module hoá phân tán, bảo đảm tính độc lập, khả năng mở rộng linh hoạt từ quy mô 1 toà nhà đến toàn bộ khu đô thị đại học ĐHQGHN tại Hoà Lạc:

```
+-----------------------------------------------------------------------------------+
|                        TẦNG 1: THU THẬP TẠI BIÊN (IOT EDGE)                      |
|  - Cảm biến quang học Sensirion SPS30 (PM1, PM2.5, PM10, TypSize, NC)            |
|  - Cảm biến vi khí hậu SHT31/DHT22 (Nhiệt độ, Độ ẩm tương đối)                    |
|  - Cảm biến hiện diện hồng ngoại thụ động PIR (ngữ cảnh chuyển động)             |
|  - Điểm tiếp nhận cộng đồng: Mã QR động gắn tại 25 khu vực & 3 cổng trường       |
+------------------------------------------+----------------------------------------+
                                           | Giao thức MQTT (TLS 8883) / HTTPS POST
                                           v
+-----------------------------------------------------------------------------------+
|                   TẦNG 2: TIẾP NHẬN & PHÁT HIỆN BIÊN (INGEST & EDGE AI)           |
|  - MQTT Broker bảo mật HiveMQ / EMQX                                              |
|  - Bộ lọc ngưỡng tức thời Tầng 1 (Rule-based: PM2.5 >= 35, bù trừ độ ẩm)        |
|  - Bộ làm sạch dữ liệu & che thông tin nhạy cảm (PII Sanitization Gateway)        |
+------------------------------------------+----------------------------------------+
                                           | Socket.IO Realtime & Internal Event Bus
                                           v
+-----------------------------------------------------------------------------------+
|                      TẦNG 3: TRUNG TÂM XỬ LÝ (BACKEND CORE HUB)                   |
|  - Node.js (TypeScript) & Express Engine tốc độ cao                               |
|  - Máy trạng thái 6 bước (State Machine Engine: received -> closed)               |
|  - Thuật toán gộp nguồn đa kênh 15 phút (Dual-Source Fusion Engine: Sensor + QR)  |
|  - Bộ kiểm soát cam kết thời gian xử lý (SLA Escalation Watchdog 15 phút)         |
|  - Kênh cảnh báo đẩy Web Push (VAPID key) độ trễ < 1 giây                         |
|  - Sandbox độc lập cho Ban Giám Khảo & Cơ chế tự dời ngày (Rolling Dates)         |
|  - ORM Prisma & CSDL SQLite/PostgreSQL hiệu năng cao                              |
+------------------------------------------+----------------------------------------+
                                           | RESTful APIs & WebSocket Streams
                                           v
+-----------------------------------------------------------------------------------+
|                   TẦNG 4: GIAO DIỆN ĐA KÊNH ĐẦU CUỐI (CLIENT PLATFORMS)           |
|  - Ứng dụng Sinh viên: Web App / Zalo Mini App (PWA không cần cài đặt, quét QR)   |
|  - Dashboard Điều hành Ban Quản lý: Sơ đồ tầng, bản đồ nhiệt, quản lý SLA         |
|  - Màn hình Ca trực An ninh: PWA tối ưu cho di động nhận Web Push rung/chuông     |
|  - Cổng thông tin Minh bạch & Tuyên truyền: Khung Infographic học đường           |
+-----------------------------------------------------------------------------------+
```

#### 1.2. Thuật toán Gộp nguồn Đa kênh (Multi-Source Fusion Engine)
- Một trong những cải tiến kỹ thuật đột phá của VNU SmarT-Free Zone là giải quyết bài toán "báo trùng và báo phân tán".
- **Cơ chế hoạt động:** Khi một sự cố khói thuốc xảy ra tại khu vực (ví dụ: *UET1-3CT*), cảm biến IoT kích hoạt trước, sau đó sinh viên có mặt quét mã QR gửi phản ánh.
- Hệ thống tự động quét cửa sổ trượt **15 phút**. Nếu phát hiện đã có phiếu đang mở tại cùng toà nhà/khu vực:
  1. Không sinh thêm phiếu mới làm phân tán lực lượng ca trực.
  2. Gộp bản ghi phản ánh của sinh viên vào phiếu hiện có.
  3. Tự động chuyển đổi thuộc tính nguồn phiếu thành `both` (cả hai nguồn: Cảm biến + Sinh viên).
  4. Nâng mức độ ưu tiên từ `normal` lên `high` hoặc `urgent` do tính xác thực của sự kiện đã được kiểm chứng chéo bởi hai kênh độc lập.

#### 1.3. Máy trạng thái 6 bước chuẩn mực (FSM State Machine)
- Toàn bộ vòng đời phiếu tuân theo máy trạng thái hữu hạn một chiều, ngăn chặn việc can thiệp trái phép:
  - `received` (Tiếp nhận) $\rightarrow$ `assigned` (Đã phân công) $\rightarrow$ `verifying` (Ca trực tiếp cận hiện trường) $\rightarrow$ `handled` (Xử lý xong) $\rightarrow$ `responded` (Duyệt phản hồi gửi SV) $\rightarrow$ `closed` (Đóng phiếu).
- Kiểm soát SLA tự động: Bộ đếm thời gian liên tục theo dõi mốc `due_at`. Nếu ca trực không chuyển sang `verifying` trong 15 phút, hệ thống tự động đánh dấu `is_overdue = true`, gắn nhãn `escalated = true` và kích hoạt báo động vượt cấp tới lãnh đạo Ban Quản lý.

---

### MỤC 2: BẢO MẬT & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY)

#### 2.1. Triết lý "Bảo vệ riêng tư theo thiết kế" (Privacy by Design)
- **Không Camera — Không Ghi hình:** Dự án nói không với việc lắp đặt camera giám sát, bảo vệ tuyệt đối không gian tự do học thuật và sự thoải mái của người học.
- **Che dữ liệu định danh (PII Masking) tại Tầng Ingest:** Ghi chú phản ánh từ sinh viên được lọc tự động qua bộ biểu thức chính quy (Regex Engine) ngay khi nhận vào backend. Các thông tin nhạy cảm (tên riêng, số điện thoại, email, mã sinh viên) đều bị che tức thì trước khi lưu vào CSDL hoặc hiển thị lên dashboard.
- **Cơ chế Mã tra cứu ẩn danh:** Sinh viên không cần đăng ký tài khoản, không để lại danh tính. Hệ thống sinh mã ngẫu nhiên dạng `K7Q2-9XMA` để sinh viên tự tra cứu tiến độ xử lý và xem phản hồi cảm ơn từ nhà trường.

#### 2.2. Phân quyền vai trò nghiêm ngặt (Role-Based Access Control - RBAC)
- **Viewer / BGK:** Vận hành trong khu thử (Sandbox) cô lập. Bấm thử kịch bản không làm xáo trộn số liệu thật, có nút "Đặt lại" để dọn sạch dữ liệu thử sau 30 phút. Không có quyền sửa đổi phiếu vận hành thật.
- **Guard (Ca trực):** Chỉ được xem danh sách phiếu phân công cho ca của mình; chỉ được thao tác cập nhật tiến độ hiện trường (`verifying`, `handled`). Không được quyền duyệt phản hồi sinh viên hay cấu hình hệ thống.
- **Analyst (Phân tích):** Chỉ đọc (Read-only) dữ liệu báo cáo, biểu đồ xu hướng và độ chính xác phân loại khói, không có quyền can thiệp vào quy trình tác chiến.
- **Manager (Ban Quản lý):** Nắm quyền tối cao trong việc điều phối ca trực, phê duyệt nội dung phản hồi chính thức cho người phản ánh và ban hành infographic tuyên truyền.

#### 2.3. Bảo mật truyền thông & Siêu dữ liệu hình ảnh (EXIF Stripping)
- Tất cả các kết nối MQTT và HTTP đều hoạt động qua mã hoá SSL/TLS.
- Khi Ban Quản lý tải lên hình ảnh Infographic tuyên truyền ($\le 2\text{ MB}$), hệ thống tự động bóc tách và loại bỏ toàn bộ các trường metadata EXIF (GPS vị trí chụp, thiết bị chụp) để triệt tiêu mọi nguy cơ rò rỉ thông tin cá nhân.

---

### MỤC 3: PHƯƠNG THỨC & LỘ TRÌNH TRIỂN KHAI 12 TUẦN (ROLLOUT ROADMAP)

Hệ thống được thiết kế theo tư duy "Phát triển nhanh bằng Web chuẩn, Nhân rộng bền vững bằng Zalo Mini App và Phần cứng chuyên dụng":

```
Tuần 1 - 2: Khảo sát & Thử nghiệm thực địa tại Toà UET1 & Nhà Đa Năng
Tuần 3 - 5: Triển khai 10 Nút Cảm biến Chuẩn hoá (SPS30 + PIR) tại 5 Toà UET
Tuần 6 - 8: Ra mắt Zalo Mini App "VNU SmarT-Free Zone" kết nối Zalo OA ĐHQGHN
Tuần 9 - 10: Tích hợp Hệ thống Điều hành Trung tâm KTX & Ban Công tác Học sinh Sinh viên
Tuần 11 - 12: Đánh giá Tác động, Tối ưu Lịch tuần tra AI và Nhân rộng toàn Hoà Lạc
```

#### 3.1. Lộ trình 12 tuần chi tiết
1. **Giai đoạn 1: Chuẩn bị & Kiểm thử thực địa (Tuần 1 – Tuần 4):**
   - Lắp đặt thử nghiệm cụm 10 nút cảm biến IoT tại các điểm nóng: Cầu thang bộ UET1, nhà vệ sinh UET2, hành lang UET3, sân thượng UET4 và Nhà đa năng.
   - Hiệu chỉnh thuật toán phát hiện Tầng 1 và phân loại Tầng 2 theo điều kiện vi khí hậu Hoà Lạc (độ ẩm mùa nồm, sương mù ngoại thành).
   - In ấn và dán poster mã QR chống bóc tại 25 khu vực và 3 cổng trường.
2. **Giai đoạn 2: Tích hợp Hệ sinh thái Zalo (Tuần 5 – Tuần 8):**
   - Đóng gói mã nguồn giao diện sinh viên (đang dùng `zmp-ui`) lên nền tảng **Zalo Mini App**.
   - Kích hoạt kênh thông báo tự động qua **Zalo Official Account (OA)** của Đoàn Thanh niên / Ban Quản lý ĐHQGHN, song song duy trì kênh Web Push dự phòng.
   - Sinh viên chỉ cần quét mã QR bằng Zalo là ứng dụng mở ngay lập tức, không cần tải hay cài đặt bất kỳ phần mềm nào khác.
3. **Giai đoạn 3: Tối ưu hoá Điều hành & Nhân rộng (Tuần 9 – Tuần 12):**
   - Chuyển giao hoàn toàn quy trình SOP 6 bước cho Đội Tự quản sinh viên và Lực lượng Bảo vệ chuyên trách ĐHQGHN tại Hoà Lạc.
   - Đưa mô hình AI dự báo điểm nóng vào vận hành thực tế: tự động phân bổ 6 ca tuần tra tối ưu mỗi ngày, tập trung vào các khung giờ có nguy cơ cao nhất.
   - Mở rộng kiến trúc sang các phân khu lân cận: Trường ĐH Việt Nhật, Trường Quốc tế, Ký túc xá số 1, 2, 3 và Khu Thể thao liên hợp.

#### 3.2. Dự toán chi phí và Khả năng nhân rộng
- Chi phí linh kiện cho mỗi nút cảm biến thông minh (ESP32-S3 + Sensirion SPS30 + PIR sensor + vỏ in 3D chống bụi) ước tính **khoảng 650.000 VNĐ/nút**.
- Với mỗi toà nhà 5 tầng tại Hoà Lạc, chỉ cần lắp đặt 2 nút tại các vị trí khuất (cầu thang bộ, WC tầng cao) kết hợp hệ thống mã QR tiếp nhận phản ánh của sinh viên, chi phí đầu tư phần cứng cho mỗi toà nhà chưa đến **1.500.000 VNĐ** nhưng đạt được độ phủ giám sát không gian lên tới 95%.
- Đây là giải pháp có tính khả thi tài chính vượt trội, hoàn toàn phù hợp với ngân sách của các trường đại học công lập tại Việt Nam.
