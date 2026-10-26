# BÁO CÁO THỬ NGHIỆM DÙNG THỬ (FORM 2) & ĐÁNH GIÁ ĐỘ KHẢ DỤNG SUS

**Dự án:** VNU SmarT-Free Zone — Không gian Học đường Không Khói thuốc  
**Đơn vị thực hiện:** Đội BND — Trường Đại học Công nghệ (UET) & ĐHQGHN  
**Thời gian thử nghiệm:** 21/10/2026 – 23/10/2026 (chia làm 2 đợt trước và sau tối ưu UX)  
**Quy mô thử nghiệm:** **34 sinh viên** trực tiếp thực hiện 3 tác vụ trên bản ứng dụng đang chạy thật.

---

## I. THIẾT KẾ THỬ NGHIỆM VÀ 3 TÁC VỤ THỰC TẾ

Sinh viên mở đường dẫn ứng dụng thử nghiệm qua điện thoại thông minh và thực hiện 3 tác vụ không có người hướng dẫn:
1. **Tác vụ 1:** Quét mã QR mẫu dán tại cửa phòng, tự động nhận diện toạ độ và gửi 1 phản ánh ẩn danh (≤ 30 giây).
2. **Tác vụ 2:** Nhận mã phiếu ngẫu nhiên (VD `K7Q2-9XMA`), sao chép và tra cứu tiến độ xử lý 6 bước của Nhà trường.
3. **Tác vụ 3:** Tìm đến tab Hỗ trợ cai thuốc và bấm thử tính năng "Vượt cơn thèm 4D" hoặc làm bài test Fagerström.

---

## II. KẾT QUẢ ĐO LƯỜNG THỰC TẾ

### 1. Thời gian thao tác và Tỷ lệ thành công
| Chỉ số | Mục tiêu cam kết | Kết quả Đợt 1 (16 SV) | Kết quả Đợt 2 (18 SV sau sửa UX) |
| :--- | :--- | :--- | :--- |
| **Thời gian gửi phản ánh (Trung vị)** | $\le 30$ giây | **21.5 giây** | **16.2 giây** |
| **Thời gian gửi nhanh nhất** | — | 12.0 giây | 9.5 giây |
| **Tỷ lệ hoàn thành tác vụ 1** | $\ge 95\%$ | 100% (16/16) | 100% (18/18) |
| **Tỷ lệ hoàn thành tác vụ 2** | $\ge 95\%$ | 93.8% (15/16) | 100% (18/18) |
| **Tỷ lệ hoàn thành tác vụ 3** | $\ge 90\%$ | 93.8% (15/16) | 100% (18/18) |

### 2. Điểm đánh giá Thang đo Độ khả dụng Hệ thống SUS (System Usability Scale)
Thang đo SUS chuẩn quốc tế gồm 10 câu hỏi (thang điểm 1–5). Điểm SUS quy đổi theo công thức:
$$\text{SUS} = 2.5 \times \left[ \sum (\text{Câu lẻ} - 1) + \sum (5 - \text{Câu chẵn}) \right]$$

- **Kết quả Đợt 1:** Điểm SUS trung bình đạt **76.8 điểm** (Hạng Tốt - Grade B).  
  *Góp ý cải thiện:* Cần thêm nút sao chép mã phiếu 1-chạm; cỡ chữ trên mobile một số chỗ hơi nhỏ.
- **Tối ưu giữa hai đợt:** Bổ sung modal popup chúc mừng có nút "📋 Sao chép mã tra cứu" và nút "Xem ngay tiến độ"; tăng độ tương phản và khoảng cách bấm ngón tay cái.
- **Kết quả Đợt 2:** Điểm SUS trung bình tăng vọt lên **83.4 điểm** (Hạng Xuất sắc - Grade A).
- **So sánh chuẩn:** Theo tiêu chuẩn đo lường quốc tế MeasuringU, điểm SUS trung bình của các phần mềm toàn cầu là 68. Điểm **83.4** đưa VNU SmarT-Free Zone vào **top 10% sản phẩm có trải nghiệm người dùng xuất sắc nhất**.

---

## III. SỰ THAY ĐỔI MỨC ĐỘ SẴN SÀNG HÀNH ĐỘNG
Khảo sát trước và sau khi sinh viên trải nghiệm ứng dụng:

| Câu hỏi đánh giá | Trước khi dùng | Sau khi dùng thử | Mức tăng |
| :--- | :---: | :---: | :---: |
| *"Nếu bắt gặp người hút thuốc trong khuôn viên KTX, bạn có sẵn sàng báo cáo không?"* (Thang 1–5) | **2.38 / 5.0** | **4.56 / 5.0** | **+91.6%** |
| *"Bạn có tin rằng phản ánh của mình sẽ được xử lý kịp thời không?"* | **2.15 / 5.0** | **4.42 / 5.0** | **+105.6%** |

**Kết luận:** Sản phẩm đã giải quyết triệt để rào cản tâm lý sợ trả thù và sự mất niềm tin của sinh viên thông qua cơ chế phản ánh ẩn danh siêu tốc và quy trình 6 bước minh bạch.
