# BÁO CÁO KẾT QUẢ KHẢO SÁT FORM 1: NHU CẦU & THỰC TRẠNG KHÓI THUỐC HỌC ĐƯỜNG

**Dự án:** VNU SmarT-Free Zone — Không gian Học đường Không Khói thuốc  
**Đơn vị thực hiện:** Đội BND — Trường Đại học Công nghệ (UET) & ĐHQGHN  
**Thời gian khảo sát:** 16/10/2026 – 22/10/2026  
**Phương thức:** Khảo sát trực tuyến qua Google Forms (Ẩn danh 100%, tự nguyện)  
**Quy mô mẫu:** **128 sinh viên** (trong đó **82 sinh viên nội trú KTX**, 46 sinh viên ngoại trú)

---

## I. MỤC TIÊU VÀ PHƯƠNG PHÁP KHẢO SÁT

1. **Mục tiêu:**
   - Thu thập số liệu thực chứng về mức độ tiếp xúc với khói thuốc thụ động và khí dung thuốc lá điện tử trong khuôn viên KTX và giảng đường ĐHQGHN.
   - Nhận diện rào cản tâm lý khiến sinh viên ngần ngại phản ánh vi phạm với Nhà trường.
   - Đo lường mức độ sẵn sàng tiếp nhận giải pháp công nghệ (quét QR ẩn danh, cảm biến IoT không camera).
   - Làm căn cứ thực tế để hiệu chỉnh các tham số trong bộ giả lập sự kiện (Simulator) và mô hình dự báo AI.

2. **Cơ cấu mẫu khảo sát:**
   - **Nơi ở:** 64.1% (82 SV) ở KTX ĐHQGHN (KTX Ngoại ngữ, KTX Mễ Trì, KTX Hoà Lạc); 35.9% (46 SV) ở trọ ngoại trú.
   - **Tình trạng hút thuốc:** 85.9% (110 SV) không hút thuốc; 14.1% (18 SV) đang hút thuốc lá điếu hoặc sử dụng Pod/Vape.

---

## II. KẾT QUẢ VÀ 3 PHÁT HIỆN CỐT LÕI

### 1. Phát hiện 1: Khói thuốc diễn ra phổ biến tại các "vùng mù" tuần tra
- **78.1%** sinh viên cho biết thường xuyên ngửi thấy mùi khói thuốc hoặc nhìn thấy người hút tại KTX ít nhất 2–3 lần mỗi tuần; trong đó **32.8%** gặp phải hằng ngày.
- **Top 3 điểm nóng vi phạm:**
  1. *Chiếu nghỉ và cầu thang bộ thoát hiểm:* **64.8%** bình chọn.
  2. *Khu vệ sinh chung tầng cao:* **57.0%** bình chọn.
  3. *Lối lên sân thượng và góc hành lang khuất:* **42.2%** bình chọn.
- **Khung giờ cao điểm:**
  - Cao điểm tối/đêm: **21:00 – 23:30** (chiếm 68.4% lượt phản ánh).
  - Cao điểm trưa: **11:30 – 13:00** (chiếm 22.1% lượt phản ánh).

### 2. Phát hiện 2: Rào cản sợ trả thù và mất lòng bạn cùng phòng
Khi được hỏi *"Vì sao bạn hiếm khi hoặc chưa từng báo cáo vi phạm hút thuốc với Ban Quản lý?"*:
- **62.5%** trả lời: *E ngại lộ danh tính, sợ bị người hút trả thù hoặc bạn bè cô lập*.
- **54.7%** trả lời: *Thủ tục phản ánh truyền thống quá phiền hà (phải trực tiếp lên phòng bảo vệ hoặc viết đơn)*.
- **48.4%** trả lời: *Nghĩ rằng báo cáo xong cũng không ai xuống giải quyết kịp thời do người hút rời đi nhanh*.

### 3. Phát hiện 3: Sự ủng hộ vượt trội với cơ chế phản ánh QR ẩn danh và cảm biến không camera
- **91.4%** sinh viên khẳng định sẽ tích cực quét mã QR để gửi phản ánh nếu được đảm bảo ẩn danh tuyệt đối (Điểm trung bình sẵn sàng đạt **4.62 / 5.0**).
- **95.3%** sinh viên đồng thuận cao việc lắp đặt cảm biến khói và cảm biến chuyển động PIR khi được giải thích rõ: *Thiết bị hoàn toàn không có camera ghi hình, không thu âm thanh, chỉ đo nồng độ hạt quang học để bảo vệ quyền riêng tư*.
- Trong số 18 sinh viên đang hút thuốc: **72.2%** (13 bạn) chia sẻ từng có ý định cai thuốc nhưng thiếu công cụ hỗ trợ kín đáo và mong muốn có nút khẩn cấp giúp vượt qua cơn thèm tức thời.

---

## III. TÁC ĐỘNG ĐẾN VIỆC THIẾT KẾ GIẢI PHÁP MVP

1. **Hiệu chỉnh bộ giả lập (Simulator):** Dồn 70% các sự kiện khói giả lập vào 2 khung giờ 21:00–23:30 và 11:30–13:00 tại các vị trí cầu thang và nhà vệ sinh tầng cao đúng như khảo sát chỉ ra.
2. **Quy tắc bảo vệ danh tính (Privacy by Design):** Loại bỏ hoàn toàn trường nhập Họ tên, MSSV, SĐT trong ứng dụng sinh viên. Bổ sung cơ chế sinh mã tra cứu ngẫu nhiên (VD `K7Q2-9XMA`) để sinh viên theo dõi tiến độ mà không lộ bất kỳ thông tin nào.
3. **Bổ sung nhánh Hỗ trợ cai thuốc (Quit Support):** Tách biệt chức năng hỗ trợ cai thuốc khỏi luồng xử phạt để tạo không gian đồng cảm, tích hợp kỹ thuật 4D và kết nối Tổng đài Quốc gia 1800 6606.
