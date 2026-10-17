# Quy chế Dữ liệu & Bảo vệ Quyền Riêng tư — VNU SmarT-Free Zone
**Đơn vị áp dụng:** Hệ thống Giám sát & Hỗ trợ Không gian Không khói thuốc KTX ĐHQGHN  
**Người soạn thảo:** Thành viên A (Ly — Trưởng kỹ thuật)  
**Căn cứ pháp lý:** Luật Phòng, chống tác hại của thuốc lá số 09/2012/QH13; Nghị quyết 173/2024/QH15; Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.

---

## 1. Nguyên tắc Cốt lõi: Bảo vệ Quyền Riêng tư ngay từ Thiết kế (Privacy by Design)

Dự án VNU SmarT-Free Zone cam kết tôn trọng tuyệt đối không gian sống và quyền riêng tư của sinh viên nội trú tại KTX ĐHQGHN:

1. **Tuyệt đối không sử dụng Camera:**
   - Hệ thống không gắn bất kỳ camera giám sát, cảm biến hình ảnh hay microphone thu âm nào trong toàn bộ khu vực sinh hoạt, hành lang, cầu thang, nhà vệ sinh.
2. **Cảm biến Hiện diện (PIR/mmWave) chỉ là đặc trưng kỹ thuật phụ:**
   - Cảm biến PIR chỉ đo tín hiệu nhị phân (chuyển động: `true / false`), hoàn toàn không có khả năng định danh, nhận diện hoặc theo dõi đường đi của cá nhân.
   - **Quy tắc đạo đức AI:** Dữ liệu hiện diện không bao giờ được dùng làm bằng chứng vi phạm, không tự động sinh phiếu phạt. Dữ liệu này chỉ hỗ trợ ca trực biết có người tại chỗ hay không để điều phối bước chân.
3. **Phản ánh Sinh viên hoàn toàn Ẩn danh:**
   - Khi quét mã QR và gửi phản ánh, hệ thống không yêu cầu đăng nhập tài khoản cá nhân, không thu thập họ tên, số điện thoại, mã sinh viên hay số phòng.
   - Hệ thống sinh một mã tra cứu ngẫu nhiên dạng `K7Q2-9XMA` để sinh viên tự kiểm tra tiến độ mà không liên kết với danh tính cá nhân.

---

## 2. Quy tắc Che Thông tin Cá nhân Tự động (PII Masking)

Toàn bộ văn bản ghi chú do người dùng gửi lên qua API `POST /api/reports` bắt buộc phải đi qua bộ lọc quy tắc regex tại tầng backend trước khi lưu vào CSDL hoặc chuyển tiếp cho mô hình AI/LLM:

- **Số điện thoại:** Mọi chuỗi số 10–11 chữ số bắt đầu bằng `0` hoặc `+84` đều tự động được chuyển thành `[SĐT_ĐÃ_CHE]`.
- **Mã sinh viên:** Các chuỗi 8 chữ số tương ứng với dải mã SV ĐHQGHN được chuyển thành `[MÃ_SV_ĐÃ_CHE]`.
- **Email:** Các định dạng email hợp lệ được chuyển thành `[EMAIL_ĐÃ_CHE]`.
- **Tên riêng:** Nếu sinh viên vô tình nhập tên bạn cùng phòng hoặc bản thân, nhân viên ca trực khi xác minh có trách nhiệm chuẩn hoá lại ghi chú trước khi lưu trữ chính thức.

---

## 3. Phân quyền Truy cập Dữ liệu theo 4 Vai trò (RBAC)

| Vai trò | Mã quyền | Quyền hạn dữ liệu | Giới hạn bảo mật |
| :--- | :--- | :--- | :--- |
| **Ban Quản lý (BQL)** | `manager` | Toàn quyền xem dashboard, bản đồ nhiệt, báo cáo tuần, phê duyệt xử lý và đăng infographic tuyên truyền. | Phải đăng nhập 2 yếu tố, ghi log mọi thao tác xuất dữ liệu. |
| **Ca trực An ninh** | `guard` | Xem danh sách phiếu được phân công, sơ đồ tầng thời gian thực và cập nhật trạng thái 6 bước. | Không có quyền xem số liệu tổng hợp toàn trường hay xoá lịch sử phiếu. |
| **Chuyên viên Phân tích** | `analyst` | Xem số liệu thống kê khuyết danh, ma trận nhầm lẫn của AI, độ chính xác mô hình. | Dữ liệu xuất ra đã được tổng hợp theo giờ/tuần, không truy cập chi tiết phiếu cá lẻ. |
| **Ban Giám khảo / Khách** | `viewer` | Xem bản đồ nhiệt, sơ đồ tầng và các tính năng demo trong khu thử nghiệm (Sandbox). | **Sandbox Mode:** Phiếu do BGK tạo tự động xoá sau 30 phút, không ảnh hưởng dữ liệu thật của KTX. |

---

## 4. Chính sách Lưu trữ và Vòng đời Dữ liệu

1. **Bản tin cảm biến thô (5 giây/lần):** Lưu tạm thời trong bộ nhớ đệm và tệp xoay vòng trong tối đa 7 ngày, sau đó nén và tự động dọn dẹp.
2. **Bản tin tóm tắt (1 phút/lần):** Lưu trữ trong cơ sở dữ liệu để phục vụ vẽ biểu đồ và phân tích xu hướng trong 6 tháng.
3. **Cửa sổ dữ liệu sự kiện (Event Window):** Chỉ lưu chi tiết dữ liệu 5 giây trong khoảng 15 phút trước và 30 phút sau khi phát hiện sự kiện khói để huấn luyện và kiểm thử mô hình AI.
4. **Quyền được lãng quên:** Sinh viên có thể yêu cầu xóa ghi chú phản ánh của mình thông qua việc cung cấp mã tra cứu cho BQL.
