# Rà soát kỹ thuật 26/10/2026 — đối chiếu bảng phân công với mã nguồn

Rà trên nhánh `feat/c-dashboard-d2-2026-10-16`, sau commit `42a24338`. Mỗi mục ghi file và dòng để người phụ trách kiểm tra lại. Phần **Đã sửa** nằm trong cùng đợt thay đổi với tài liệu này; phần **Còn mở** chưa động tới.

## Đã sửa trong đợt này

| Mục | Phụ trách gốc | Thay đổi |
| :--- | :--- | :--- |
| Chạy bằng một lệnh | A | `npm run setup` (tự gọi trước `npm run dev` và `npm run test:backend`) tạo `backend/.env`, sinh Prisma Client, đồng bộ schema, nạp dữ liệu demo. Trước đây clone mới thì API sandbox / infographic / dời ngày trả 500 vì thiếu `DATABASE_URL`. |
| Typecheck bỏ sót backend | A | `tsconfig.json` gốc chỉ kiểm `backend/src/contracts`; nay kiểm toàn bộ `backend/src`, `backend/tests`, `scripts`. Sửa 6 chỗ import kiểu `TelemetryMessage` không tồn tại (đúng là `Telemetry`). |
| Chống spam phản ánh | A, B | Backend thật chưa có giới hạn (chỉ máy chủ giả có). Nay: 3 phản ánh / 10 phút / thiết bị, trả 429 kèm lời nhắn nhẹ nhàng; phản ánh khẩn cấp không bao giờ bị chặn. App SV hiện lời nhắn màu vàng thay vì báo lỗi đỏ. |
| Tra cứu không hiện phản hồi | B | App SV đọc `response_note`, backend trả `feedback`. Đã khớp theo hợp đồng; thêm `arrived_at` (giờ ca trực có mặt, không kèm tên). |
| API infographic lộ tên cán bộ | A | `GET /api/infographics` (công khai) trả `created_by.name`; nay chỉ trả vai trò. |
| Sandbox BGK | A, C | Dọn tự động 30 phút chỉ xoá trong CSDL, không xoá bản trong RAM mà dashboard đọc, và xoá phiếu trước lịch sử nên vi phạm khoá ngoại. Phiếu sandbox không có hạn xử lý, lịch sử, sự kiện realtime; mã 3 chữ số dễ trùng. Đã sửa cả. Thêm khung **Khu thử của Ban Giám khảo** (Chạy kịch bản / Đặt lại) trên Tổng quan và hướng dẫn 3 bước ở trang đăng nhập. |
| Khung infographic Tổng quan | C | Trước là ô giữ chỗ; nay hiện infographic mới nhất BQL đăng. |
| Màn ca trực | C | Thêm "Lịch sử phiếu của tôi". |
| Nhãn dữ liệu mô phỏng | C | Tab Dự báo và Minh bạch nay ghi rõ "dựa trên dữ liệu mô phỏng, gồm N sự kiện"; bỏ số "140" viết cứng trong tiêu đề ma trận nhầm lẫn. |
| Trang phản ánh | B | Nhắc "Không ghi tên, số phòng của người khác" đặt ngay dưới ô ghi chú; nút đúng nhãn "Khẩn cấp (cháy, có người ngất)", xác nhận xong là gửi luôn phiếu ưu tiên cao nhất (trước chỉ bật chế độ, phải bấm gửi lần nữa); thêm nút gọi 114 / 115. Link `?trial=1` hoặc `?src=form2` gửi cờ dùng thử Form 2. |
| App SV khi triển khai | B | Gọi `/api` tương đối nên bản Vercel không có API; thêm `VITE_API_URL` (xem `frontend/student-app/.env.example`). |
| Firmware thiếu `ts` | D | Bản tin Wokwi thiếu trường `ts` bắt buộc nên bị hợp đồng từ chối; bộ đệm offline chỉ giữ 5 trường và không gửi giờ gốc. Nay đồng bộ giờ NTP, gắn `ts` (+07:00), bộ đệm 60 bản tin giữ nguyên bản gốc, gửi bù chỉ bật `late`. **Cần D chạy thử trên Wokwi** (chưa biên dịch được trên máy rà soát). |
| Bộ giả lập trực tiếp | D | `live.ts` gửi cho 7/10 nút không có trong danh mục khu vực; nay lấy đúng 10 nút từ `contracts/zones.ts` và luân phiên điểm nóng. |
| Hướng dẫn BGK | C | Viết lại: dùng tài khoản `bgk` trong sandbox (bản cũ bảo BGK đăng nhập `bql` sửa phiếu thật), chừa chỗ điền link chính thức, bỏ khẳng định "Wokwi báo đỏ ngay trên dashboard" (backend chưa nhận MQTT), bỏ số liệu viết cứng. |
| Lời thoại video | C | [LOI-THOAI-VIDEO.md](thuyet-minh/LOI-THOAI-VIDEO.md) — chờ E duyệt. |

## Còn mở — cần người phụ trách xử lý

### Số liệu viết cứng (ưu tiên cao: liên quan tính trung thực của hồ sơ)

Các con số dưới đây đang hiển thị trên dashboard hoặc trích trong thuyết minh, nhưng **không được tính từ dữ liệu**. Trước khi nộp, hoặc tính lại, hoặc bỏ khỏi hồ sơ.

| Ở đâu | Viết cứng | Phụ trách |
| :--- | :--- | :--- |
| `backend/src/ai/index.ts` `getModelTransparencyMetrics()` | Toàn bộ trang Minh bạch: 420 sự kiện (bộ giả lập chỉ sinh 278), precision/recall từng loại, ma trận nhầm lẫn, độ trễ, 3 bộ kiểm tra độ bền | E |
| `backend/src/ai/forecast/index.ts` | Điểm nóng, điểm rủi ro 92/88/84…, 6 ca tuần tra, độ phủ 38,5% → 84,6% và 3 mức giả định; `zones`/`tickets` lấy ra nhưng không dùng; mã khu vực không tồn tại | D |
| `backend/src/ai/llm/index.ts` | Báo cáo tuần: 8,2 phút, 58,2/34,1/7,7%, các số đếm…; không gọi Claude API | E |
| `backend/src/api/stats.ts:38-39, 56-75` | `sla_compliance_rate: 94.5`, `avg_response_minutes: 8.2`; bản đồ nhiệt dùng `Math.random`/`sin` | A |
| `scripts/latency/measure.ts:88-89, 134` | Chia "phát hiện / gửi thông báo" theo hệ số 0,45 / 0,55 tự đặt; `status: "PASS"` cố định; chỉ đo vòng HTTP nội bộ, không đo tới điện thoại. P95 = 2,31 ms trong `docs/reports/ket-qua-do-do-tre.json` không phải độ trễ tới điện thoại ca trực | D |
| `scripts/run-milestone-1.ts:88-96` | "340ms" là chuỗi in ra, phản ánh SV gửi sau 0,8 giây thay vì 60 giây | A, D |
| `docs/thuyet-minh/BANG-TONG-HOP-MINH-CHUNG-TIEN-DO.md` | Ghi "100% đạt" cho D và E; trích P95 2,31 ms, độ phủ 84,6% | E |
| `docs/thuyet-minh/THUYET-MINH-SAN-PHAM-VONG-2.md` mục 7, 9 | Trích các số trên; bảng linh kiện ghi "2 nhà cung cấp" nhưng mỗi linh kiện chỉ có 1 giá, không link, không ngày | E, D |

### Bộ phát hiện và phân loại chưa chạy trong hệ thống (E)

- `smokeDetector` (tầng 1) và bộ phân loại tầng 2 chỉ được gọi trong test. Luồng nhận bản tin dùng hàm riêng `detectSmokeAnomaly` (`backend/src/ingest/mqtt.ts:138-160`): PM2.5 ≥ 35 hoặc tăng 20 trong 3 bản tin, không có điều kiện "kéo dài", độ tin cậy gán cứng 0,92 / 0,82.
- Tầng 1: ngưỡng tuyệt đối ≥ 35 được OR vào nên mức nền không có tác dụng (`detect/index.ts:106`); hơi nước tắt hẳn cảnh báo thay vì giảm độ tin cậy; chưa có luật hạt to (quét dọn).
- Tầng 2 là chuỗi if, không phải mô hình huấn luyện; chưa có phiên bản, ngày huấn luyện, script huấn luyện/đánh giá; `ai/models/`, `ai/training/` trống. Không có phát hiện "đợt khói kết thúc", không ghi loại sự kiện về phiếu — tiêu chí "phiếu được gắn thuốc lá điếu khi đợt khói kết thúc" chưa đạt.

### IoT và bộ giả lập (D)

- Backend **không có client MQTT** (không có gói `mqtt`); `ingest/mqtt.ts` chỉ nhận HTTP. Bản tin Wokwi lên broker công khai nhưng không tới hệ thống.
- Broker là `broker.hivemq.com:1883`, không mã hoá, không tài khoản riêng từng bên (yêu cầu ở giai đoạn I).
- `generate.ts` chỉ sinh nhãn sự kiện và tóm tắt: không có dữ liệu 5 giây, không có bản tóm tắt mỗi phút, không có tín hiệu hiện diện / PIR sai, không nạp CSDL; không sinh loại "ô nhiễm ngoài trời"; không có seed ngẫu nhiên; 7/10 mã nút không có trong danh mục khu vực.
- `scripts/simulator/scenarios/22h10-B5.ts` và `scripts/simulator/README.md` đang trống.
- `B5-CTD` không còn trong danh mục nhưng vẫn dùng ở `tests/api.test.ts`, `backend/tests/contracts.test.ts`, `scripts/test-server/send-report.ts`.

### App sinh viên (B)

- Chưa có trang thêm toà / khu vực (backend cũng chưa có `POST /api/zones`); trang in QR ghi "25 vị trí" thay vì 20, và lấy ảnh QR từ `api.qrserver.com` nên in khi mất mạng sẽ hỏng.
- Góc kiến thức có 4 thẻ, chưa ghi nguồn; chưa có trang "Bạn muốn bỏ thuốc?" riêng; Hỗ trợ cai thuốc có 4 phần (yêu cầu 5); infographic hiện ở trang Phòng ngừa thay vì Hỗ trợ.
- Chưa ghi thời gian thao tác của phản ánh dùng thử (Form 2 cần số này) và chưa đếm ẩn danh lượt mở trang hỗ trợ (E cần).

### Bảo mật (A)

- `backend/prisma/seed.ts` lưu mật khẩu dạng chữ thường trong trường `password_hash`. Cần băm (bcrypt/argon2) trước khi đưa link công khai, cùng với bước "đổi toàn bộ mật khẩu" ở giai đoạn IV.

### Hồ sơ khảo sát (B, E)

- `docs/reports/form1-khao-sat-nhu-cau.md` và `form2-dung-thu-va-sus.md` chưa đính kèm dữ liệu gốc. Theo tiêu chí "mọi con số đều ghi được lấy từ đâu", cần xuất CSV từ Google Forms (đã ẩn danh) vào `docs/reports/` và ghi tên file trong báo cáo.

## Việc không làm được bằng mã nguồn

Họp, phát và thu Form 1/Form 2, in poster, quay và dựng video, đăng YouTube/Drive, triển khai link chính thức, cài UptimeRobot, đổi mật khẩu máy chủ, gắn thẻ `v1.0-vong2`, nộp bài — cần người trong đội thực hiện.
