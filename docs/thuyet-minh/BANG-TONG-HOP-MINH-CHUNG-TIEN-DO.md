# BẢNG TỔNG HỢP TIẾN ĐỘ NHIỆM VỤ & MINH CHỨNG ĐẠT CHUẨN 5 TIÊU CHÍ CHẤM ĐIỂM
### CUỘC THI: SÁNG TẠO VÌ MỘT THẾ HỆ KHÔNG KHÓI THUỐC
---

**Dự án:** VNU SmarT-Free Zone — Không gian Học đường Không Khói thuốc  
**Đội thi:** BND (Trường Đại học Công nghệ — ĐHQGHN)  
**Tình trạng tổng thể:** **HOÀN THÀNH 100% TOÀN BỘ 25 HẠNG MỤC THEO KẾ HOẠCH MVP VÒNG 2**

---

## I. BẢNG TIẾN ĐỘ CHI TIẾT THEO 5 THÀNH VIÊN (A — E)

| Vai trò & Phụ trách | Nhiệm vụ phân công | Trạng thái | Sản phẩm bàn giao & Tệp minh chứng |
| :--- | :--- | :---: | :--- |
| **A — Kiến trúc & Backend** | • 3 Hợp đồng dữ liệu (`contracts/`)<br>• CSDL Prisma & Seed 25 khu vực UET<br>• FSM 6 bước, Gộp nguồn 15p, SLA<br>• Web Push VAPID, Sandbox BGK<br>• API Swagger OpenAPI 3.0 | **100% ĐẠT** | • Code: `backend/src/` (27/27 test passed)<br>• Docs: [docs/sop-van-hanh.md](../sop-van-hanh.md)<br>• Docs: [docs/quy-che-du-lieu-va-quyen-rieng-tu.md](../quy-che-du-lieu-va-quyen-rieng-tu.md)<br>• Docs: [docs/thuyet-minh-kien-truc-va-bao-mat.md](../thuyet-minh-kien-truc-va-bao-mat.md) |
| **B — Ứng dụng SV & Khảo sát** | • Web App Sinh viên PWA/Zalo style<br>• Phản ánh QR ≤ 30s & Mã tra cứu<br>• Nút khẩn cấp 114/115 & Che PII<br>• Lớp Cai thuốc 4D, Fagerström<br>• Khảo sát Form 1 (128 SV) & Form 2 (34 SV - SUS 83.4)<br>• Công cụ in poster QR hàng loạt A4 | **100% ĐẠT** | • Code: `frontend/student-app/` (Port 5174)<br>• Docs: [docs/reports/form1-khao-sat-nhu-cau.md](../reports/form1-khao-sat-nhu-cau.md)<br>• Docs: [docs/reports/form2-dung-thu-va-sus.md](../reports/form2-dung-thu-va-sus.md)<br>• Công cụ: Trang In QR trên app |
| **C — Dashboard Quản lý & Video** | • Dashboard 4 vai trò & Realtime Socket<br>• Sơ đồ mặt bằng khuôn viên UET vector hoá<br>• Màn hình ca trực 3 nút cho điện thoại<br>• Trang Điều phối kiểm soát hạn 3 phút<br>• Trung tâm Phân tích & AI Analytics<br>• Khung đăng tải Infographic BQL | **100% ĐẠT** | • Code: `frontend/admin/` (Port 5173)<br>• Trang: `Analytics.tsx` với 4 tab chuyên sâu<br>• Sơ đồ: `uet-campus-base.svg` & `campusPlan.ts`<br>• PWA Service Worker: `sw.ts` |
| **D — IoT, Giả lập & Dự báo** | • Firmware ESP32 Wokwi (DHT22+SPS30+PIR+Buzzer)<br>• Cơ chế lưu đệm Offline tự phát bù (`late: true`)<br>• Bộ giả lập sinh 6 tuần (278 sự kiện có nhãn)<br>• Live simulator 10 nút chu kỳ 5 giây<br>• Đo đạc độ trễ P95 = 2.31 ms (100 lần)<br>• Lập lịch tuần tra 6 ca & BOM linh kiện | **100% ĐẠT** | • Link Wokwi: [https://wokwi.com/projects/478273736679993345](https://wokwi.com/projects/478273736679993345)<br>• Script: `scripts/simulator/generate.ts`<br>• Script: `scripts/simulator/live.ts`<br>• Script: `scripts/latency/measure.ts`<br>• Dữ liệu: `docs/reports/ket-qua-do-do-tre.json` |
| **E — Trí tuệ Nhân tạo & Hồ sơ** | • Tầng 1: Rolling Median + MAD + Lọc hơi nước/ô nhiễm<br>• Tầng 2: Phân loại 6 sự kiện khí dung<br>• Mô hình dự báo rủi ro không - thời gian<br>• LLM tự động tổng hợp báo cáo tuần & lọc ghi chú<br>• Thuyết minh Vòng 2 chuẩn 13 chương<br>• Hướng dẫn Ban Giám khảo | **100% ĐẠT** | • Code: `backend/src/ai/` (detect, classify, forecast, llm)<br>• Docs: [docs/thuyet-minh/THUYET-MINH-SAN-PHAM-VONG-2.md](THUYET-MINH-SAN-PHAM-VONG-2.md)<br>• Docs: [docs/thuyet-minh/HUONG-DAN-BAN-GIAM-KHAO.md](HUONG-DAN-BAN-GIAM-KHAO.md)<br>• Test: `backend/tests/ai-analytics.test.ts` |

---

## II. MA TRẬN ĐỐI CHIẾU 5 TIÊU CHÍ CHẤM ĐIỂM CỦA BAN TỔ CHỨC

| Tiêu chí chấm điểm | Trọng số & Yêu cầu | Bằng chứng trong Sản phẩm thực tế | Bằng chứng trong Hồ sơ thuyết minh |
| :--- | :---: | :--- | :--- |
| **1. Tính sáng tạo và đổi mới** | **20%** | • Thuật toán gộp nguồn đa kênh (Cảm biến + QR SV) trong 15p.<br>• Phân loại 6 loại sự kiện khí dung (nhận diện Pod/Vape siêu mịn).<br>• AI dự báo rủi ro chuyển hoá thành lịch 6 ca tuần tra tối ưu.<br>• Kỹ thuật 4D cắt cơn thèm có nhịp thở trực quan trên app. | • Mục 1, 5, 7 trong Thuyết minh Vòng 2.<br>• Bảng so sánh đột phá với biển cấm, bảo vệ đi tuần và camera truyền thống.<br>• Mô hình can thiệp học đường 4 lớp độc đáo. |
| **2. Chất lượng và mức độ hoàn thiện** | **25%** | • Hệ thống chạy mượt mà trên cả máy tính và điện thoại (PWA).<br>• 27/27 bài kiểm thử tự động vượt qua (100% pass).<br>• Không có lỗi runtime, mã nguồn TypeScript chặt chẽ.<br>• Swagger UI tương tác trực tiếp tại `/docs`. | • Mục 6 trong Thuyết minh Vòng 2.<br>• Bản thiết kế kiến trúc 4 tầng.<br>• Điểm đo lường độ khả dụng SUS đạt **83.4 điểm** (Grade A - Top 10% thế giới). |
| **3. Tính khả thi và triển khai thực tế** | **20%** | • Firmware ESP32 chạy thật trên Wokwi, sẵn sàng nạp mạch thật.<br>• Hệ thống vận hành được ngay bởi người thật qua quy trình SOP 6 bước.<br>• Chi phí 1 cụm cảm biến chỉ **1.120.000 VNĐ** (chưa tới 1,5 triệu/toà). | • Mục 8, 9 trong Thuyết minh Vòng 2.<br>• Bảng danh mục linh kiện (BOM) có báo giá 2 nhà cung cấp trong nước.<br>• Quy trình SOP vận hành và Quy chế dữ liệu & quyền riêng tư. |
| **4. Hiệu quả và tác động dự kiến** | **20%** | • Đo lường độ trễ P95 đạt **2.31 mili-giây** (vượt xa cam kết < 5s).<br>• Mô phỏng tăng độ phủ tuần tra gấp 2.2 lần (38.5% lên **84.6%**).<br>• Số liệu khảo sát 128 sinh viên và đo đạc dùng thử 34 sinh viên thật. | • Mục 2, 3, 7 trong Thuyết minh Vòng 2.<br>• Báo cáo Form 1 (nhu cầu) và Form 2 (SUS).<br>• Tỷ lệ sinh viên sẵn sàng phản ánh tăng từ 2.38 lên 4.56/5.0 (+91.6%). |
| **5. Khả năng nhân rộng** | **15%** | • Cơ chế "Zero-cost Scaling": Chỉ cần in mã QR là triển khai được ngay toà mới trong 5 phút.<br>• Đóng gói chuẩn hoá PWA / Zalo Mini App không phụ thuộc phần cứng độc quyền. | • Mục 10 trong Thuyết minh Vòng 2.<br>• Lộ trình 3 giai đoạn: KTX UET → Toàn ĐHQGHN → Mạng lưới Đại học toàn quốc.<br>• Gói tài liệu chuyển giao All-in-one. |

---

## III. DANH MỤC THÀNH PHẦN HỒ SƠ NỘP VÒNG 2

1. **Bản mô tả sản phẩm / giải pháp chính thức:**  
   📄 [docs/thuyet-minh/THUYET-MINH-SAN-PHAM-VONG-2.md](THUYET-MINH-SAN-PHAM-VONG-2.md) (Đầy đủ 11 chương toàn diện).
2. **Hướng dẫn trải nghiệm dành cho Ban Giám khảo:**  
   📄 [docs/thuyet-minh/HUONG-DAN-BAN-GIAM-KHAO.md](HUONG-DAN-BAN-GIAM-KHAO.md) (Trải nghiệm nhanh 3 bước trong 5 phút).
3. **Báo cáo thực chứng Khảo sát Nhu cầu (Form 1):**  
   📄 [docs/reports/form1-khao-sat-nhu-cau.md](../reports/form1-khao-sat-nhu-cau.md) (128 sinh viên tham gia).
4. **Báo cáo thực chứng Thử nghiệm Khả dụng & Điểm SUS (Form 2):**  
   📄 [docs/reports/form2-dung-thu-va-sus.md](../reports/form2-dung-thu-va-sus.md) (34 sinh viên, điểm SUS 83.4).
5. **Báo cáo Kết quả Đo đạc Kiểm chuẩn Độ trễ (100 lần đo):**  
   📄 [docs/reports/ket-qua-do-do-tre.json](../reports/ket-qua-do-do-tre.json) (P95 = 2.31 ms).
6. **Quy trình Vận hành Tiêu chuẩn (SOP):**  
   📄 [docs/sop-van-hanh.md](../sop-van-hanh.md).
7. **Quy chế Quản trị Dữ liệu & Quyền riêng tư (Privacy by Design):**  
   📄 [docs/quy-che-du-lieu-va-quyen-rieng-tu.md](../quy-che-du-lieu-va-quyen-rieng-tu.md).
8. **Đường dẫn Firmware Wokwi ESP32 Trực tiếp:**  
   🔗 [https://wokwi.com/projects/478273736679993345](https://wokwi.com/projects/478273736679993345).
