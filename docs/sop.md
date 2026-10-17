# Quy trình Vận hành Chuẩn (SOP) — VNU SmarT-Free Zone
**Áp dụng:** Lực lượng Ca trực An ninh & Ban Quản lý KTX ĐHQGHN  
**Người soạn thảo:** Thành viên A (Ly — Trưởng kỹ thuật)  
**Mục tiêu:** Đảm bảo mọi phản ánh từ sinh viên và cảnh báo từ cảm biến được tiếp nhận, xử lý kịp thời, minh bạch, đúng thẩm quyền và tuân thủ cam kết SLA.

---

## 1. Chu trình 6 bước xử lý phiếu

Hệ thống hoạt động theo máy trạng thái nghiêm ngặt, không cho phép nhảy cóc. Mọi thao tác đều lưu vết người thực hiện và thời gian:

```
[1. Tiếp nhận] ──> [2. Phân công] ──> [3. Xác minh] ──> [4. Xử lý] ──> [5. Phản hồi] ──> [6. Đóng phiếu]
  (received)         (assigned)        (verifying)       (handled)        (responded)         (closed)
```

| Bước | Tên bước | Trạng thái mã | Người thực hiện | Thời hạn (SLA) | Nội dung công việc |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Tiếp nhận** | `received` | Hệ thống tự động | Ngay lập tức | Tự động tạo phiếu từ bản tin cảm biến hoặc phản ánh QR. Gộp nguồn nếu cùng khu vực trong 15 phút. Phát Web Push tới điện thoại ca trực. |
| **2** | **Phân công** | `assigned` | Trưởng ca trực / Hệ thống | ≤ 3 phút | Phân công nhân sự ca trực phụ trách khu vực/toà nhà tương ứng. |
| **3** | **Xác minh** | `verifying` | Nhân viên ca trực | ≤ 15 phút | Ca trực bấm "Đang đến" -> di chuyển đến hiện trường -> bấm "Đã đến". Quan sát, kiểm tra mùi khói, tàn thuốc hoặc người vi phạm. |
| **4** | **Xử lý** | `handled` | Nhân viên ca trực | ≤ 30 phút | Nhắc nhở người vi phạm, yêu cầu dập tắt thuốc lá/vape, ghi biên bản nội bộ nếu tái phạm. Nếu là báo động giả (hơi nước, bụi, xịt phòng), ghi rõ lý do. |
| **5** | **Phản hồi** | `responded` | Ban Quản lý / Ca trực | ≤ 12 giờ | Nhập nội dung phản hồi tóm tắt vào hệ thống (không chứa thông tin cá nhân). Sinh viên tra cứu qua mã sẽ thấy thông tin này. |
| **6** | **Đóng phiếu** | `closed` | Trưởng ca / BQL | ≤ 48 giờ | Rà soát toàn bộ kết quả, đánh giá chất lượng xử lý và đóng phiếu lưu kho phân tích. |

---

## 2. Cam kết Thời hạn Xử lý (SLA) & Cảnh báo Chuyển cấp

1. **Thời gian tiếp cận hiện trường:**
   - **Mức thông thường (`normal`):** ≤ 15 phút.
   - **Mức cao (`high` - gộp cả cảm biến và SV):** ≤ 10 phút.
   - **Mức khẩn cấp (`urgent` - nút Khẩn cấp):** ≤ 5 phút.
2. **Chuyển cấp tự động khi quá hạn (Escalation):**
   - Nếu sau thời hạn `due_at` mà ca trực chưa chuyển sang trạng thái `verifying` hoặc `handled`:
     - Phiếu chuyển sang màu đỏ trên Dashboard.
     - Hệ thống phát thông báo cảnh báo trực tiếp đến tài khoản Trưởng Ban Quản lý (`bql`).
     - Yêu cầu Trưởng ca trực giải trình lý do trễ hạn khi đóng phiếu.

---

## 3. Xử lý Tình huống Khẩn cấp

- Khi có phản ánh qua nút **Khẩn cấp** (`emergency: true`) hoặc cảm biến khói tăng đột biến kết hợp nhiệt độ cao:
  1. Ca trực gác lại các công việc tuần tra thường nhật, tiếp cận hiện trường trong 5 phút.
  2. Mang theo bình chữa cháy xách tay và bộ đàm liên lạc.
  3. Nếu phát hiện nguy cơ hoả hoạn thực tế: nhấn chuông báo cháy toà nhà, báo ngay Đội PCCC cơ sở và tổng đài 114, đồng thời phối hợp sơ tán sinh viên theo sơ đồ thoát hiểm.

---

## 4. Quyền hạn và Trách nhiệm của Ban Quản lý (BQL)

1. **Phân quyền và Bảo mật:** Chỉ tài khoản BQL có quyền xem thống kê toàn KTX, duyệt nội dung phản hồi sinh viên và đăng infographic tuyên truyền.
2. **Infographic Tuyên truyền:**
   - Căn cứ vào bản đồ nhiệt và điểm nóng tuần tra (gợi ý bởi AI), BQL định kỳ đăng infographic tuyên truyền phòng chống tác hại thuốc lá vào các toà nhà có tần suất vi phạm cao.
   - Infographic xuất hiện trực tiếp trên trang chủ ứng dụng Sinh viên khi quét QR tại toà nhà đó.
3. **Phản hồi Sinh viên:**
   - Đảm bảo 100% sinh viên gửi phản ánh nhận được phản hồi lịch sự, văn minh qua mã tra cứu ngẫu nhiên trong vòng 24–48 giờ.
