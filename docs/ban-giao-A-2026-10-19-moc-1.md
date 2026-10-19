# Báo cáo Bàn giao Mốc 1 (19/10/2026 — D5) — Thành viên A (Ly)
**Khối:** Kiến trúc & Backend lõi (Trưởng kỹ thuật)  
**Nhánh Git:** `feat/a-backend-base-d2-2026-10-16`  
**Mốc kiểm soát:** MỐC 1 (Tích hợp luồng đầu–cuối toàn hệ thống)  
**Đối tượng bàn giao:** Toàn bộ đội ngũ (B — Mạnh, C — Cúc, D — Đức, E — Hà)

---

## 1. Cập nhật Danh mục Khu vực thực tế: Trường Đại học Công nghệ (UET) Hoà Lạc

Hệ thống đã chuyển đổi toàn bộ danh mục khu vực từ giả định KTX sang **khuôn viên thực tế Trường Đại học Công nghệ (UET) — ĐHQGHN tại Hoà Lạc**:

* **Toà UET1 (5 tầng):** `UET1-1SH`, `UET1-2CT`, `UET1-3CT` (*Cảm biến S01*), `UET1-4HL`, `UET1-5WC` (*Cảm biến S02*).
* **Toà UET2 (5 tầng):** `UET2-1SH`, `UET2-2HL`, `UET2-3CT` (*Cảm biến S03*), `UET2-4HL`, `UET2-5WC` (*Cảm biến S04*).
* **Toà UET3 (5 tầng):** `UET3-1SH`, `UET3-2HL` (*Cảm biến S05*), `UET3-3CT`, `UET3-4WC` (*Cảm biến S06*), `UET3-5ST`.
* **Toà UET4 (4 tầng):** `UET4-1SH`, `UET4-2CT` (*Cảm biến S07*), `UET4-3HL`, `UET4-4ST` (*Cảm biến S08*).
* **Nhà đa năng (ĐN - 2 tầng):** `DN-1SH`, `DN-1WC` (*Cảm biến S09*), `DN-2HL` (*Cảm biến S10*).
* **3 Cổng trường Hoà Lạc:** `CONG-1` (Cổng chính), `CONG-2` (Cổng phụ phía Tây), `CONG-3` (Cổng KTX & thể thao).

👉 Tổng cộng: **25 vị trí mã QR** và **10 nút cảm biến IoT** tại các vị trí nguy cơ cao.

---

## 2. Kết quả hoàn thành công việc đến ngày 19/10/2026 (Mốc 1)

1. **MQTT Telemetry Ingest & Anomaly Detection (`backend/src/ingest/mqtt.ts`):**
   - Tiếp nhận bản tin cảm biến 5s/lần, lưu lịch sử ngắn và tính tóm tắt mỗi phút.
   - Thuật toán Tầng 1: Tự động phát hiện khói bất thường (PM2.5 ≥ 35 ug/m3 hoặc tăng vọt > 20 ug/m3), lọc hơi nước và bụi quét dọn.
   - Tự động gắn trạng thái sự kiện `unclassified`, nhận diện hiện diện PIR (`presence: true/false`).
   - Tự động mở phiếu và gộp nguồn thông minh.

2. **Kênh cảnh báo Ca trực Web Push (`backend/src/notify/webpush.ts`):**
   - Đăng ký nhận push notification từ trình duyệt ca trực qua VAPID key.
   - Gửi cảnh báo tức thì trong vòng 5 giây tới điện thoại ca trực:  
     `"🚨 CẢNH BÁO KHÓI THUỐC | Vị trí: UET1-3CT | Có người tại chỗ (PIR bật)"`.

3. **Kiểm soát hạn SLA & Tự động chuyển cấp (Escalation):**
   - Endpoint `GET /api/tickets/overdue` liệt kê các phiếu quá hạn 15 phút.
   - Tự động đánh dấu `is_overdue: true` và `escalated: true` để chuyển cấp lên tài khoản BQL.

4. **Kịch bản kiểm chứng tích hợp Mốc 1 (`scripts/run-milestone-1.ts`):**
   - Đã kiểm chứng trọn vẹn 6 bước luồng đầu–cuối:
     `Cảm biến phát hiện khói` → `MQTT Ingest tạo phiếu` → `Web Push ca trực` → `Sinh viên quét QR gửi phản ánh` → `Gộp nguồn ±15 phút` → `Ca trực xử lý 6 bước` → `Sinh viên tra cứu thấy kết quả`.
   - Lệnh chạy kiểm thử demo:
     ```bash
     npm run demo:m1
     ```

5. **Bộ kiểm thử tự động:**
   - Đạt **17/17 test cases (100% pass)**:
     ```bash
     npm run test:backend
     ```
