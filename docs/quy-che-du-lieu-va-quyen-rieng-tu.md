# QUY CHẾ QUẢN TRỊ DỮ LIỆU & BẢO VỆ QUYỀN RIÊNG TƯ
## HỆ THỐNG VNU SMART-FREE ZONE — ĐHQGHN TẠI HOÀ LẠC
**Mã văn bản:** QC-DL-SFZ-2026-v2.0  
**Tác giả chủ trì:** Ly (Thành viên A — Kiến trúc & Backend lõi)  
**Đơn vị áp dụng:** Toàn bộ người dùng, quản trị viên, ca trực và sinh viên tại ĐHQGHN  

---

### I. NGUYÊN TẮC CỐT LÕI: "BẢO VỆ RIÊNG TƯ THEO THIẾT KẾ" (PRIVACY BY DESIGN)
Dự án VNU SmarT-Free Zone xây dựng môi trường học đường không khói thuốc dựa trên tinh thần **tự giác, tôn trọng quyền riêng tư và đồng hành cùng người học**. Hệ thống tuyệt đối không biến khuôn viên đại học thành không gian giám sát cá nhân.

---

### II. DANH MỤC DỮ LIỆU: THU THẬP VÀ KHÔNG THU THẬP

| Hạng mục | Dữ liệu ĐƯỢC PHÉP thu thập | Dữ liệu TUYỆT ĐỐI CẤM thu thập |
| :--- | :--- | :--- |
| **Hình ảnh & Âm thanh** | **KHÔNG CÓ.** Hệ thống không tích hợp bất kỳ thiết bị ghi hình hay ghi âm nào. | • Nghiêm cấm lắp đặt Camera giám sát dưới mọi hình thức.<br>• Nghiêm cấm ghi âm giọng nói của sinh viên. |
| **Cảm biến môi trường IoT** | • Chỉ số hạt bụi mịn: $PM_1, PM_{2.5}, PM_{10}\ (\mu g/m^3)$.<br>• Mật độ hạt số $NC$, kích thước hạt điển hình $TypSize$.<br>• Nhiệt độ $(^\circ C)$, Độ ẩm tương đối $(RH\%)$. | Không can thiệp hoặc giải mã sóng vô tuyến cá nhân xung quanh nút cảm biến. |
| **Cảm biến hiện diện PIR** | • Trạng thái nhị phân: `presence = true/false` (có chuyển động nhiệt tại vùng quét hay không).<br>• Thời gian kể từ lần kích hoạt gần nhất (`presence_age`). | • Không nhận diện danh tính người chuyển động.<br>• Không lưu trữ hình dáng hay hướng di chuyển. |
| **Phản ánh của Sinh viên** | • Mã khu vực quét QR.<br>• Loại hành vi ghi nhận (khói thuốc, mùi, tàn thuốc).<br>• Token ngẫu nhiên của thiết bị (chỉ dùng chống spam, đổi định kỳ).<br>• Ghi chú mô tả ngữ cảnh. | • Không thu thập Họ và tên.<br>• Không thu thập Số điện thoại, Email.<br>• Không thu thập Mã số sinh viên hay định vị GPS cá nhân. |
| **Tài liệu Infographic BQL** | • Hình ảnh tuyên truyền chính sách, thông điệp sức khoẻ dạng PNG/JPEG ($\le 2\text{ MB}$). | • Bắt buộc tự động bóc tách và xoá bỏ toàn bộ siêu dữ liệu EXIF (toạ độ GPS chụp ảnh, mẫu máy ảnh, thời gian chụp). |

---

### III. CƠ CHẾ CHE THÔNG TIN ĐỊNH DANH (PII SANITIZATION) TẠI CẤP ĐỘ INGEST
Nếu sinh viên vô tình nhập thông tin cá nhân (tên, số điện thoại, mã sinh viên) vào ô ghi chú phản ánh, hệ thống backend áp dụng ngay thuật toán lọc regex **trước khi ghi xuống CSDL hoặc gửi đi bất kỳ đâu**:

```
Số điện thoại:  0912 345 678      ===>   [SĐT_ĐÃ_CHE]
Email:          sv@vnu.edu.vn     ===>   [EMAIL_ĐÃ_CHE]
Mã sinh viên:   22028888          ===>   [MÃ_SV_ĐÃ_CHE]
Họ tên học viên: Nguyễn Văn A     ===>   [TÊN_ĐÃ_CHE]
```
Toàn bộ log hệ thống, dashboard của ca trực và các mô hình phân tích ngôn ngữ (LLM) chỉ tiếp cận bản ghi đã được làm sạch hoàn toàn.

---

### IV. QUY ĐỊNH ĐẶC BIỆT VỀ CẢM BIẾN HIỆN DIỆN (PIR)
1. **Mục đích duy nhất:** Cảm biến PIR chỉ đóng vai trò cung cấp **ngữ cảnh phụ trợ** để thuật toán phân loại AI tầng 2 đánh giá xác suất sự kiện (ví dụ: phân biệt giữa khói có người đứng hút với khói do chập điện hoặc bụi quét dọn khi không có người).
2. **Quy tắc pháp lý nghiêm ngặt:**
   - Cảm biến PIR **không bao giờ tự động mở phiếu xử lý sự cố**.
   - **Tuyệt đối không sử dụng tín hiệu PIR làm bằng chứng quy kết vi phạm** hoặc căn cứ kỷ luật đối với bất kỳ cá nhân nào.

---

### V. PHÂN QUYỀN TRUY CẬP DỮ LIỆU (ROLE-BASED ACCESS CONTROL)

| Vai trò | Phạm vi truy cập dữ liệu | Thẩm quyền dữ liệu |
| :--- | :--- | :--- |
| **Khách / BGK (`viewer`)** | Chỉ xem dữ liệu thống kê tổng hợp và thao tác trong vùng Sandbox riêng biệt. | Được tạo phiếu thử nghiệm trong Sandbox. Không được xem hay sửa đổi phiếu vận hành thật. |
| **Ca trực an ninh (`guard`)** | Chỉ xem các phiếu được phân công cho ca trực của mình và danh mục khu vực. | Cập nhật trạng thái hiện trường (`verifying`, `handled`). Không được xem dữ liệu cấu hình hệ thống. |
| **Chuyên viên (`analyst`)** | Xem toàn bộ số liệu thống kê, báo cáo xu hướng, biểu đồ điểm nóng và độ chính xác AI. | Chế độ chỉ đọc (Read-only). Không được can thiệp vào quy trình xử lý phiếu. |
| **Ban Quản lý (`manager`)** | Toàn quyền xem và quản trị hệ thống dữ liệu. | Phân công ca trực, phê duyệt phản hồi gửi sinh viên, đăng infographic và quản lý danh mục khu vực. |

---

### VI. CHÍNH SÁCH LƯU TRỮ VÀ TIÊU HUỶ DỮ LIỆU (RETENTION POLICY)
1. **Dữ liệu Telemetry cảm biến chi tiết (5s/lần):** Lưu trữ trong **30 ngày** để phục vụ huấn luyện và hiệu chỉnh mô hình; sau 30 ngày tự động nén thành số liệu tổng hợp theo giờ và xoá bỏ bản ghi thô.
2. **Phiếu xử lý sự cố & Báo cáo:** Lưu trữ trong vòng **1 học kỳ (6 tháng)** phục vụ tổng kết thi đua và đánh giá tác động chính sách; sau đó ẩn danh hoá hoàn toàn toạ độ chi tiết.
3. **Dữ liệu thử nghiệm Sandbox của BGK:** Tự động xoá vĩnh viễn sau **30 phút** kể từ khi tạo hoặc lập tức xoá sạch khi bấm nút "Đặt lại".
4. **Sao lưu dữ liệu:** Cơ sở dữ liệu được tự động sao lưu định kỳ vào 00:00 mỗi đêm và lưu trữ tại máy chủ an toàn với khoá mã hoá riêng biệt.
