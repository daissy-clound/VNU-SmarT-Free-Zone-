Kế hoạch MVP Vòng 2 — VNU SmarT-Free Zone (Đội BND)

# **1\. Tóm tắt kế hoạch**

Sau 10 ngày (D1–D10), đội BND nộp một MVP chạy được của VNU SmarT-Free Zone. MVP vận hành trọn vòng phát hiện → phản ánh → xử lý → phản hồi trên dữ liệu KTX giả lập, kèm bằng chứng thật từ 2 form khảo sát sinh viên.

Cách định vị khi trình bày: một mô hình can thiệp học đường 4 lớp:

**Phát hiện → Phản hồi → Phòng ngừa → Hỗ trợ**

# **2\. Cách vượt qua 2 hạn chế**

## **Giữ nguyên kiến trúc Vòng 1**

Cách xử lý hạn chế (không có Zalo Mini App, phần cứng): lớp thiết bị chạy mô phỏng, lớp Zalo chạy trên web. Phần máy chủ, AI và dashboard là thật và dùng lại nguyên vẹn khi triển khai.

| Thành phần Vòng 1 | Bản MVP 10 ngày | Khi triển khai thật | Bằng chứng trong demo |
| :---- | :---- | :---- | :---- |
| Nút cảm biến ESP32 \+ SPS30 \+ DHT \+ cảm biến hiện diện | Firmware ESP32 thật (Arduino C++) chạy trên Wokwi. DHT22 và cảm biến chuyển động PIR có sẵn trong Wokwi; bụi mịn giả bằng biến trở qua một lớp driver chung | Nạp cùng firmware vào ESP32 thật, chỉ đổi driver sang thư viện SPS30; cảm biến hiện diện dùng PIR (HC-SR501) hoặc radar mmWave (LD2410, nhận được cả người đứng yên) | Vặn biến trở \+ bật PIR trên Wokwi → cảnh báo hiện trên dashboard và Web Push, kèm trạng thái "Có người tại chỗ" |
| 10 cụm cảm biến ở KTX | Bộ giả lập (Node.js/TS) cho 10 nút: chế độ lịch sử 6 tuần có nhãn sự kiện, chế độ trực tiếp qua MQTT, chế độ kịch bản demo | Nút thật thay nút giả, cùng định dạng bản tin MQTT | Dashboard có sẵn 6 tuần dữ liệu; trang "Minh bạch thuật toán" |
| Zalo Mini App cho sinh viên | Web app (PWA) dựng bằng React \+ zmp-ui (bộ giao diện chính thức của Zalo Mini App). Mở bằng camera khi quét QR, không cần cài app | Đóng gói cùng mã giao diện vào dự án Zalo Mini App khi được duyệt; web app giữ lại cho người không dùng Zalo | Link demo \+ QR in trên poster |
| Cảnh báo qua Zalo OA tới ca trực | Web Push tới màn hình ca trực (PWA) có nút "Đang đến / Đã đến / Báo nhầm", kèm thông báo realtime trên dashboard; thử thêm Zalo Bot gửi tin kèm link; adapter Zalo OA viết sẵn giao diện | Bật adapter Zalo OA (cần OA đã xác thực); giữ Web Push làm dự phòng | Điện thoại nhận tin trong video; đo độ trễ |

 

## **Lưu ý khi dùng Wokwi**

•       Wokwi giả lập mạng WiFi mở Wokwi-GUEST có Internet, nên ESP32 mô phỏng kết nối được tới broker MQTT bên ngoài (Wokwi – ESP32 WiFi Networking).

•       Gateway công cộng của Wokwi bị giám sát lưu lượng và chỉ ổn định mức trung bình. Chỉ gửi dữ liệu giả, dùng tài khoản broker riêng cho demo, không đưa khoá bí mật thật vào firmware.

•       Độ trễ \< 5 giây đo trên bộ giả lập (ổn định); Wokwi dùng để chứng minh firmware chạy thật. Quay sẵn một lượt chạy Wokwi tốt để dựng video.

•       Danh sách linh kiện của Wokwi có DHT22 nhưng chưa có cảm biến bụi mịn nào, kể cả SPS30 (Wokwi – Supported Hardware). Nếu dư thời gian, viết "chip tuỳ biến" bằng Custom Chips API (C, đang beta) để firmware chạy đúng giao thức I2C của SPS30 (Wokwi – Custom Chips).

•       Wokwi có cảm biến chuyển động PIR (wokwi-pir-motion-sensor) nhưng không có radar mmWave. MVP dùng PIR qua cùng lớp driver; khi triển khai thật có thể đổi sang mmWave mà không đổi bản tin.

## **Cảm biến hiện diện: vì sao thêm và giới hạn**

•       **Mục đích:** cho biết lúc khói tăng có người ở khu vực hay không, và hiện còn người hay không. Ca trực biết có nên đến ngay; AI tách được khói thuốc (có người) khỏi ô nhiễm ngoài trời hoặc bụi lan từ nơi khác (không có người).

•       Chỉ đo có/không có người. Không thu hình ảnh, âm thanh, không đếm người, không nhận dạng ai. Nêu rõ điều này trên poster QR và trang "Minh bạch thuật toán".

•       PIR chỉ bắt chuyển động: người đứng yên lâu có thể không được ghi nhận, người đi ngang có thể bị ghi nhận. Vì vậy hiện diện chỉ là đặc trưng phụ, không tự mở phiếu và không dùng làm bằng chứng vi phạm.

•       **Chi phí thêm mỗi nút:** PIR khoảng 20–40 nghìn đồng, mmWave khoảng 60–120 nghìn đồng (D lấy báo giá khi lập BOM); dự toán 2,2 triệu đồng/nút ở Vòng 1 vẫn đủ.

## **Lưu ý khi dùng zmp-ui**

•       ZaUI (gói zmp-ui) là bộ component React, cài bằng npm install zmp-ui và nạp zmp-ui/zaui.css (ZaUI – Installation).

•       Ngay D1, dựng thử một trang zmp-ui trong dự án Vite thường. Nếu vướng phụ thuộc Zalo, chuyển sang Tailwind mô phỏng giao diện Zalo; chốt trước khi hết D1.

•       MVP không gọi API riêng của Zalo (zmp-sdk). Mọi chỗ cần nền tảng (đọc mã khu vực từ QR, mã thiết bị ẩn danh, mở liên kết) gom vào một lớp platform để sau này thay bằng zmp-sdk.

## **Kênh cảnh báo ca trực: không dùng Telegram**

•       Ngày 21/05/2025, Công văn 2312/CVT-CS của Cục Viễn thông yêu cầu các nhà mạng chặn Telegram tại Việt Nam; văn bản được ghi là còn hiệu lực (Digital Policy Alert). Dùng Telegram có thể khiến cảnh báo không tới, và trông thiếu cẩn trọng với một dự án của trường.

•       **Kênh chính:** Web Push tới màn hình ca trực dạng PWA. Đây là chuẩn web, miễn phí, không cần nền tảng nào duyệt; bấm thông báo là mở thẳng phiếu có 3 nút. Trên iPhone, phải thêm PWA vào màn hình chính thì mới nhận được thông báo.

•       Thử thêm Zalo Bot ngay D1. Zalo Bot Platform có API kiểu sendMessage và webhook (Zalo Bot docs), nhưng tài liệu chưa nêu rõ điều kiện tạo bot, giá và nút bấm. Vì vậy bot chỉ gửi tin kèm link tới phiếu; không tạo được thì bỏ, MVP không bị ảnh hưởng.

**Lập luận cho thuyết minh:** Vòng 1 đã cam kết giữ đầu mối cho người không dùng Zalo. Web app chính là kênh đó; Zalo Mini App là kênh bổ sung khi được duyệt, không phải phương án chữa cháy.

# **3\. Phạm vi MVP**

MVP gồm 25 hạng mục, đội làm toàn bộ. Cột Chủ trì dùng mã vai trò A–E ở mục 6\.

| Hạng mục | Tiêu chí hoàn thành | Chủ trì |
| :---- | :---- | :---- |
| Web app SV: QR → phản ánh → mã phiếu → theo dõi | Vị trí tự điền từ QR; gửi trong ≤ 30 giây, không đăng nhập; tối đa 3 phản ánh/10 phút/thiết bị; trang theo dõi hiện đúng trạng thái; mã tra cứu ngẫu nhiên, không đoán được; nút Khẩn cấp; 1 trang hỗ trợ cai thuốc tĩnh | B |
| Bộ giả lập 10 nút cảm biến | 6 tuần dữ liệu, 5 giây/điểm, có nhãn 6 loại sự kiện và tín hiệu hiện diện đi kèm (lưu file; CSDL giữ bản tóm tắt 1 phút); chạy như worker trên máy chủ, phát trực tiếp qua MQTT; kịch bản demo chạy bằng 1 lệnh | D |
| Firmware ESP32 trên Wokwi | Vào được Wokwi-GUEST; đọc PIR; gửi bản tin JSON đúng hợp đồng (có trường presence) mỗi 5 giây kèm heartbeat; dự án Wokwi để công khai | D |
| Phát hiện bất thường (tầng 1\) | Baseline động theo từng nút; lọc hơi nước và ô nhiễm toàn toà; sinh sự kiện "nghi vấn – chưa phân loại" kèm độ tin cậy; thời gian phát hiện trung vị ≤ 2 phút | E |
| Phiếu và quy trình 6 bước | Đủ 6 trạng thái; gộp nguồn cùng khu vực trong ±15 phút; SLA và chuyển cấp khi quá hạn; lưu lịch sử thao tác | A |
| Cảnh báo ca trực qua Web Push | Tin đến \< 5 giây (P95) tính từ lúc gắn cờ; trên trang phiếu bản điện thoại, bấm "Đang đến / Đã đến / Báo nhầm" để cập nhật phiếu | A |
| Dashboard quản lý | KPI tổng quan, sơ đồ tầng có trạng thái nút, danh sách/chi tiết phiếu, bản đồ nhiệt nghi vấn/xác nhận, sức khoẻ thiết bị | C |
| Bản triển khai công khai | 2 link (SV, quản lý) chạy ổn định; dữ liệu 6 tuần tự lùi ngày để luôn mới; tài khoản BGK được chạy kịch bản trong sandbox tự đặt lại | A |
| 2 form khảo sát: nhu cầu và dùng thử | Form nhu cầu ≥ 100 phản hồi; form dùng thử ≥ 30 phản hồi có điểm SUS; thời gian thao tác lấy từ log ẩn danh của app | B |
| Thuyết minh \+ video demo | Đúng mẫu của Ban Tổ chức; video 3–5 phút theo kịch bản ở mục 9 | E, C |
| Phân loại sự kiện (tầng 2\) \+ trang "Minh bạch thuật toán" | Ma trận nhầm lẫn, precision/recall từng loại, cảnh báo nhầm/nút/ngày trên tập kiểm tra | E |
| Dự báo điểm nóng \+ gợi ý lịch tuần tra | Xếp hạng khu vực × khung giờ cho tuần tới; kiểm chứng lùi so với tuần tra cố định | D |
| Mô phỏng độ phủ: tuần tra cố định so với hệ thống | Tỷ lệ sự kiện được tiếp cận trong 15 phút ở 2 kịch bản, kèm phân tích độ nhạy | D |
| LLM: báo cáo tuần \+ sàng lọc ghi chú | Báo cáo tuần tiếng Việt từ số liệu tổng hợp; ghi chú được che tên/SĐT bằng quy tắc trước khi gửi LLM; vẫn chạy khi không có API key | E |
| Màn hình ca trực trên điện thoại | Bản đầy đủ: nhận Web Push, xem lịch sử phiếu của mình, điền phiếu xác minh bằng một tay | C |
| Cấu hình toà nhà \+ in QR hàng loạt | Thêm toà/khu vực trên giao diện, xuất PDF QR để in trong \< 5 phút | B |
| Lớp Phòng ngừa & Hỗ trợ trong app SV | Thẻ kiến thức (khói thuốc thụ động, thuốc lá điện tử, Nghị quyết 173/2024/QH15); hiện infographic BQL đăng từ dashboard; lối vào hỗ trợ cai thuốc tách khỏi luồng xử lý vi phạm | B |
| Firmware lưu tạm khi mất mạng, gửi bù | Ngắt WiFi trên Wokwi → gửi bù đúng dấu thời gian gốc; dashboard đánh dấu "dữ liệu trễ" | D |
| Bộ ấn phẩm truyền thông | Poster QR sinh từ hệ thống, 1 infographic, 1 video mạng xã hội 30–45 giây | B, C |
| Cảm biến hiện diện trong phát hiện và cảnh báo | Trường presence đi qua MQTT tới CSDL; tầng 2 dùng tỷ lệ thời gian có người làm đặc trưng; tin Web Push và trang phiếu ghi "Có người tại chỗ / Không còn ai / Không rõ"; sơ đồ tầng hiện trạng thái hiện diện của nút | D, E |
| Hỗ trợ cai thuốc trong app SV | Ẩn danh, không đăng nhập, dữ liệu chỉ lưu trên máy người dùng: (1) tự đánh giá mức phụ thuộc nicotine (thang Fagerström, 6 câu); (2) kế hoạch cai: chọn ngày bắt đầu, lý do, tình huống dễ thèm; (3) bộ đếm ngày không hút, tiền tiết kiệm, mốc lợi ích sức khoẻ; (4) nút "Đang thèm thuốc" mở bài vượt cơn 3–5 phút (thở, uống nước, đi bộ); (5) gọi nhanh tổng đài tư vấn cai thuốc lá 1800 6606 (miễn phí) và y tế trường. Không gắn với phiếu vi phạm; chỉ đếm lượt dùng ẩn danh | B |
| Khung infographic tuyên truyền trên dashboard | BQL dán (Ctrl+V), kéo thả hoặc tải ảnh PNG/JPG/WebP ≤ 2 MB, nhập tiêu đề, toà/khu vực áp dụng, thời gian hiển thị; ảnh hiện ở trang tổng quan dashboard, đẩy sang lớp Phòng ngừa của app SV và có link trình chiếu cho màn hình sảnh; dashboard gợi ý toà nên ưu tiên theo bản đồ nhiệt; chỉ vai trò BQL được đăng, xoá EXIF khi tải lên; đếm lượt xem ẩn danh | C (B cấp nội dung) |
| Chip SPS30 tuỳ biến trên Wokwi | Firmware đọc SPS30 qua I2C ngay trong mô phỏng | D |
| Trợ lý cai thuốc (chatbot LLM) | Đặt trong mục Hỗ trợ cai thuốc; chỉ trả lời từ nội dung đã duyệt; luôn chỉ tới tổng đài tư vấn và y tế trường | E |
| Chuỗi "x ngày không khói" theo tầng | Chỉ hiển thị chiều tích cực, không xếp hạng tầng "tệ nhất" | B |

 

# **4\. Kiến trúc, công nghệ và môi trường giả lập**

Đọc từ trên xuống: tin từ cảm biến đi qua broker MQTT và bộ phát hiện, tin từ sinh viên đi thẳng qua HTTPS. Cả hai thành phiếu ở API rồi tới ca trực và dashboard.

## **Công nghệ và nơi chạy**

| Khối | Công nghệ đề xuất | Nơi chạy | Chủ trì |
| :---- | :---- | :---- | :---- |
| Web app SV | React \+ Vite \+ TypeScript, zmp-ui, PWA | Vercel hoặc Netlify | B |
| Dashboard \+ màn hình ca trực | React \+ Vite \+ TS, Ant Design, ECharts (bản đồ nhiệt), sơ đồ tầng bằng SVG; màn hình ca trực là PWA nhận Web Push; khung infographic lưu ảnh ở kho lưu trữ ảnh gói miễn phí (Supabase Storage hoặc Cloudinary) | Vercel hoặc Netlify | C (E, D làm trang phân tích) |
| API, phiếu, SLA, nhận dữ liệu MQTT | Node.js \+ TS, Fastify hoặc Express, Prisma, Socket.IO, zod, mqtt.js | Render, Railway hoặc VPS nhỏ | A |
| Cơ sở dữ liệu | PostgreSQL; bản tin thô 5 giây để ở file, CSDL giữ bản tóm tắt 1 phút và cửa sổ thô quanh sự kiện | Neon hoặc Supabase | A |
| Kênh cảnh báo ca trực | Web Push (thư viện web-push, khoá VAPID); adapter Zalo Bot thử nghiệm; adapter Zalo OA dựng sẵn giao diện | Trong API | A |
| Broker MQTT | Broker đám mây có TLS và tài khoản riêng (VD: HiveMQ Cloud) | Đám mây | D |
| Bộ giả lập \+ kịch bản demo | Node.js \+ TS, mqtt.js; chạy như worker cạnh API để các nút luôn online; dữ liệu tự lùi ngày | Cùng máy chủ API | D |
| Firmware | Arduino C++ cho ESP32: WiFi, PubSubClient (QoS 0), ArduinoJson, DHT, PIR qua chân GPIO (ngắt) | Wokwi | D |
| Phát hiện tầng 1 \+ phân loại tầng 2 | Một module TS packages/detect dùng chung cho chạy trực tiếp và đánh giá offline; tầng 2 huấn luyện bằng Python (scikit-learn) rồi xuất sang JS | Trong API | E |
| Dự báo \+ lịch tuần tra | TS, thống kê theo khu vực × giờ × thứ | Trong API | D |
| LLM | Claude API (@anthropic-ai/sdk): Haiku 5.5 phân loại ghi chú, Sonnet 5.5 viết báo cáo tuần | Trong API | E |

 

Hạn mức gói miễn phí của hosting, CSDL và broker thay đổi thường xuyên; người chủ trì kiểm tra ngay D1, đặc biệt chế độ "ngủ" khi không có truy cập.

## **Cấu trúc kho mã (1 repo GitHub)**

apps/student   	B  web app SV (zmp-ui)  
apps/admin     	C  dashboard \+ màn hình ca trực (PWA); E, D làm các trang phân tích  
services/api   	A  REST \+ Socket.IO \+ phiếu/SLA \+ nhận MQTT \+ kênh cảnh báo  
packages/shared	A  kiểu dữ liệu, schema zod, danh mục khu vực  
packages/detect	E  phát hiện tầng 1, trích đặc trưng, phân loại tầng 2  
packages/forecast  D  dự báo điểm nóng \+ lịch tuần tra  
tools/sim      	D  bộ giả lập 10 nút \+ kịch bản demo (chạy như worker)  
firmware/esp32 	D  mã Arduino \+ diagram.json của Wokwi  
ml/            	E  huấn luyện, đánh giá, xuất mô hình  
docs/          	E  thuyết minh, số liệu, ảnh chụp màn hình

## **3 hợp đồng dữ liệu (chốt D1; sau D3 muốn đổi phải báo cả đội)**

1\.     **Bản tin cảm biến** — topic sfz/{site}/{nodeId}/telemetry, QoS 0 kèm seq để phát hiện mất gói (PubSubClient chỉ publish được QoS 0 — README), 5 giây/lần khi chạy trực tiếp. late: true đánh dấu bản tin gửi bù sau khi mất mạng; heartbeat đi qua topic sfz/{site}/{nodeId}/status. presence \= true nếu có chuyển động trong 5 giây vừa qua; presence\_age là số giây kể từ lần cuối thấy chuyển động (null nếu nút chưa có cảm biến hiện diện).

{"node\_id": "B5-CTD", "ts": "2026-10-20T22:10:05+07:00", "seq": 18234,  
 "pm1": 41.2, "pm25": 58.7, "pm10": 63.0, "nc": 312.5, "typ\_size": 0.48,  
 "temp": 29.4, "rh": 71.5, "presence": true, "presence\_age": 3,  
 "rssi": \-61, "fw": "0.3.0", "late": false}

2\.     **Phản ánh SV** — POST /api/reports, trả về mã tra cứu ngẫu nhiên, tách khỏi mã phiếu nội bộ để không ai đoán được phiếu của người khác. Cờ emergency dành cho nút Khẩn cấp. Không có trường tên, SĐT hay ảnh; ghi chú được che bằng quy tắc ngay khi nhận.

{"zone\_code": "B5-CTD", "type": "smoke\_now | smell | vape | butts | other",  
 "ongoing": true, "emergency": false, "note": "Mùi khói ở chiếu nghỉ", "device\_token": "anon-7f3a..."}  
→ {"tracking\_code": "K7Q2-9XMA", "status": "received"}

3\.     **Sự kiện và phiếu** — mỗi sự kiện (từ cảm biến hoặc phản ánh) gắn vào đúng một phiếu; phiếu đi qua 6 trạng thái received → assigned → verifying → handled → responded → closed.

{"event\_id": "ev\_8812", "source": "sensor | report", "zone\_code": "B5-CTD",  
 "started\_at": "...", "ended\_at": "...",  
 "class": "unclassified | cigarette | vape | steam | dust | spray | ambient",  
 "confidence": 0.83, "ticket\_code": "SF-261020-042"}

## **Môi trường KTX giả lập (cả đội dùng chung)**

•       2 toà A và B, mỗi toà 6 tầng. Mã khu vực \= {Toà}{Tầng}-{Vị trí}, VD B5-CTD là Toà B, tầng 5, cầu thang Đông.

•       10 nút cảm biến: A2-WC, A3-CTT, A4-HL, A5-CTD, A6-ST, B2-WC, B3-CTT, B4-HL, B5-CTD, B6-ST (WC \= khu rửa tay nhà vệ sinh chung, không trong buồng; CTT/CTD \= cầu thang Tây/Đông; HL \= cuối hành lang; ST \= lối lên sân thượng).

•       20 mã QR: 10 đặt cùng vị trí nút cảm biến, 10 ở sảnh, nhà xe, căng-tin, hành lang giữa.

•       Điểm nóng giả định: B5-CTD, B6-ST, A6-ST; cao điểm 11:30–13:00 và 21:00–24:00, cuối tuần tăng. D6 hiệu chỉnh lại theo kết quả khảo sát thật.

•       Phản ánh giả lập sinh từ sự kiện thật với xác suất 20–40%, cộng 5–10% phản ánh sai; thời gian xử lý của ca trực cũng được giả lập để dashboard có KPI.

## **Kịch bản demo chuẩn — "22:10, B5-CTD"**

1\.     Bộ giả lập (hoặc biến trở trên Wokwi) tạo sự kiện thuốc lá ở B5-CTD.

2\.     Hệ thống gắn cờ "nghi vấn – chưa phân loại", mở phiếu, gửi Web Push cho ca trực kèm "Có người tại chỗ" (PIR đang bật); khi sự kiện kết thúc, tầng 2 gắn loại (VD: thuốc lá điếu).

3\.     Một SV quét QR tại B5-CTD, gửi "Đang có người hút" → gộp vào cùng phiếu, nâng ưu tiên.

4\.     Ca trực bấm "Đang đến" rồi "Đã đến", điền xác minh; BQL xử lý theo thẩm quyền và gửi phản hồi.

5\.     SV nhập mã tra cứu, thấy "Đã xử lý" kèm lời cảm ơn.

6\.     Dashboard cập nhật bản đồ nhiệt; dự báo tuần tới gợi ý tuần tra B5–B6 lúc 21:00–23:00; BQL đăng một infographic cho toà B, ảnh hiện ngay trong app SV.

# **5\. Lớp AI**

AI làm 4 việc, việc nào cũng có đầu ra đo được trên dữ liệu có nhãn. Không việc nào được tự kết luận vi phạm: mọi đầu ra chỉ là "nghi vấn" cho đến khi người xác minh.

| Việc | Đầu vào | Phương pháp | Đầu ra cho người dùng | Cách đánh giá | Chủ trì |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 1\. Phát hiện bất thường (tầng 1\) | Chuỗi PM1/PM2.5/PM10, nhiệt độ, độ ẩm, hiện diện của từng nút | Baseline động (trung vị trượt 30 phút) \+ độ lệch bền (MAD); kích hoạt khi vượt ngưỡng đủ lâu; lọc hơi nước, bụi thô và ô nhiễm toàn toà; có người hiện diện thì tăng độ tin cậy, không có thì không chặn cảnh báo | Sự kiện "nghi vấn – chưa phân loại" kèm độ tin cậy và trạng thái hiện diện; cảnh báo phát ngay | Tỷ lệ bắt được (recall), cảnh báo nhầm/nút/ngày, thời gian phát hiện | E |
| 2\. Phân loại sự kiện (tầng 2\) | Đặc trưng sự kiện: đỉnh, tốc độ tăng, thời gian tắt, tỷ lệ PM1/PM2.5, kích thước hạt điển hình, nồng độ số hạt, biến động độ ẩm, số nút cùng tăng, tỷ lệ thời gian có người hiện diện | Random Forest hoặc cây quyết định, huấn luyện trên dữ liệu giả lập có nhãn | Nhãn 1 trong 6 loại (bảng dưới), gắn khi sự kiện kết thúc | Ma trận nhầm lẫn, precision/recall từng loại | E |
| 3\. Dự báo điểm nóng \+ gợi ý tuần tra | Sự kiện đã xác nhận (trọng số cao) và nghi vấn (trọng số thấp) của 4 tuần gần nhất | Tần suất theo khu vực × giờ × thứ, làm mượt, ưu tiên dữ liệu gần; chọn K ca tuần tra phủ nhiều sự kiện kỳ vọng nhất | Bảng "top khung giờ – khu vực" và lịch tuần tra gợi ý | Kiểm chứng lùi: học tuần 1–4, thử tuần 5–6; % sự kiện rơi vào ca được gợi ý so với lịch cố định | D |
| 4\. LLM (Claude) | Số liệu tổng hợp tuần; ghi chú của SV đã được che bằng quy tắc | Prompt có cấu trúc, chỉ nhận số liệu đã tổng hợp hoặc ghi chú đã làm sạch | Báo cáo tuần tiếng Việt; nhãn cho ghi chú (spam, bình thường, cần ưu tiên) | Đọc soát 10 báo cáo mẫu; tỷ lệ gắn nhãn đúng trên 50 ghi chú thử | E |

## **6 loại sự kiện trong bộ giả lập (giả định khởi điểm)**

| Loại | Hình dạng tín hiệu | Dấu hiệu phân biệt |
| :---- | :---- | :---- |
| Thuốc lá điếu (cigarette) | Tăng trong 1–3 phút, giảm dần trong 10–30 phút | Hạt mịn chiếm ưu thế; độ ẩm gần như không đổi |
| Thuốc lá điện tử (vape) | Nhiều đỉnh nhọn theo từng hơi, tắt trong 1–3 phút | Đỉnh rất cao nhưng ngắn; hạt mịn |
| Hơi nước nhà tắm (steam) | Tăng chậm, kéo dài 10–20 phút | Độ ẩm tăng mạnh cùng lúc (\> 85%) |
| Bụi quét dọn (dust) | Kéo dài 5–15 phút, thường buổi sáng | Hạt to: kích thước hạt điển hình lớn hơn hẳn khói thuốc |
| Bình xịt (spray) | Một đỉnh cực ngắn 10–60 giây | Thời lượng rất ngắn |
| Ô nhiễm ngoài trời (ambient) | Tăng chậm trong nhiều giờ | Nhiều nút cùng tăng một lúc; thường không có người hiện diện |

 

## **Quy tắc dùng AI**

•       Bộ giả lập sinh 6 tuần dữ liệu 5 giây/điểm, đúng nhịp bản tin trực tiếp, để thấy được bình xịt 10–60 giây và từng hơi vape. Tuần 1–4 dùng để chỉnh ngưỡng và huấn luyện, tuần 5–6 chỉ để đánh giá; ngưỡng chốt trước khi đánh giá, đúng cam kết Vòng 1\.

•       Dữ liệu do chính đội sinh ra nên mô hình dễ "học lại" bộ giả lập. Thêm 3 bộ kiểm tra độ bền: tham số lệch ±30%, sự kiện chồng nhau (VD: hút thuốc lúc đang có hơi nước), tỷ lệ các loại sự kiện khác nhau. Báo cáo khoảng kết quả, không chỉ một con số.

•       Cảnh báo phát ngay từ tầng 1 với nhãn "chưa phân loại". Tầng 2 gắn nhãn khi sự kiện kết thúc, vì thời gian tắt chỉ đo được lúc đó.

•       Theo datasheet, PM4 và PM10 của SPS30 được tính từ phân bố của các hạt đo được (Sensirion SPS30 datasheet). Vì vậy dùng kích thước hạt điển hình và nồng độ số hạt làm đặc trưng, không dựa vào PM10.

•       Công bố số đo kèm điều kiện ("trên N sự kiện giả lập, tham số X"), không gọi là độ chính xác thực tế.

•       Chỉ người xác minh được đổi "nghi vấn" thành "đã xác nhận"; bản đồ nhiệt luôn tách hai lớp này.

•       Hiện diện chỉ là đặc trưng phụ: không tự mở phiếu, không dùng làm bằng chứng vi phạm. Bộ kiểm tra độ bền có thêm trường hợp PIR bỏ sót người đứng yên và PIR báo người đi ngang.

•       Ghi chú của SV được che tên, SĐT, mã SV bằng quy tắc ngay khi nhận, trước khi lưu hay gửi LLM. Tình huống khẩn cấp đi qua nút Khẩn cấp riêng, không chờ AI. Không có API key thì dùng mẫu báo cáo điền sẵn để demo vẫn chạy.

# **6\. Phân công 5 thành viên**

| Vai trò | Người phụ trách | Khối kỹ thuật sở hữu | Phần hồ sơ / nội dung | Mục thuyết minh viết chính |
| :---- | :---- | :---- | :---- | :---- |
| A — Kiến trúc & Backend lõi (trưởng kỹ thuật) |   | Repo, hợp đồng dữ liệu, CSDL, API, đăng nhập theo vai trò, phiếu/SLA/gộp nguồn, realtime, kênh cảnh báo ca trực (Web Push, thử Zalo Bot), sandbox cho BGK, triển khai | Quy trình vận hành (SOP) cho ca trực và BQL; quy chế dữ liệu và quyền riêng tư | Kiến trúc; Bảo mật và quyền riêng tư; Phương thức triển khai |
| B — Ứng dụng SV & khảo sát |   | Web app SV (zmp-ui), mã tra cứu, nút Khẩn cấp, lớp Phòng ngừa & Hỗ trợ, tính năng Hỗ trợ cai thuốc, cấu hình toà nhà \+ in QR | 2 form khảo sát (nhu cầu, dùng thử): thiết kế, phát, nhắc; poster QR, infographic; nội dung cai thuốc (nhờ y tế trường duyệt) | Đối tượng và nhu cầu; Trải nghiệm người dùng và kết quả form dùng thử |
| C — Dashboard vận hành & video |   | Dashboard quản lý, sơ đồ tầng, màn hình phiếu, màn hình ca trực (PWA nhận Web Push), bản đồ nhiệt, khung infographic tuyên truyền | Video demo 3–5 phút (kịch bản, quay, dựng); video mạng xã hội 30–45 giây; ảnh chụp màn hình | Mô tả sản phẩm (ảnh chụp, hướng dẫn sử dụng) |
| D — IoT, giả lập & dự báo | Trần Hà Anh Đức | Firmware Wokwi (gồm cảm biến hiện diện PIR), broker MQTT, bộ giả lập 10 nút (chạy trên máy chủ), kịch bản demo, dự báo \+ lịch tuần tra, mô phỏng độ phủ, đo độ trễ | Danh mục linh kiện (BOM, có PIR/mmWave), dự toán cập nhật, kế hoạch lắp đặt và hiệu chỉnh khi có thiết bị; chi phí nhân rộng mỗi toà | Kênh cảm biến; Nguồn lực và kinh phí; Khả năng nhân rộng |
| E — AI, đánh giá & điều phối hồ sơ |   | Phát hiện tầng 1 và phân loại tầng 2 (packages/detect), LLM (báo cáo tuần, nhãn ghi chú), trang Phân tích và Minh bạch thuật toán | Phân tích 2 form khảo sát; tổng biên tập thuyết minh; điều phối họp định kỳ 3 ngày/lần; chấm thử theo tiêu chí | Tóm tắt; Vấn đề; Mục tiêu; Kết quả và đánh giá tác động |

 

## **Sản phẩm bàn giao và trách nhiệm**

| Sản phẩm bàn giao | Chủ trì | Phối hợp | Người duyệt | Hạn |
| :---- | :---- | :---- | :---- | :---- |
| Hợp đồng dữ liệu, repo, danh mục khu vực | A | D, E | Cả đội | D1 |
| Form khảo sát nhu cầu | B | E | Cả đội | Phát D2, đóng D7 |
| Bộ giả lập \+ dữ liệu 6 tuần | D | E | A | D3; hiệu chỉnh D6 |
| Luồng đầu–cuối: cảm biến/QR → phiếu → Telegram → dashboard | A | B, C, D, E | Cả đội | D5 |
| Web app SV hoàn chỉnh | B | A | C | D6 |
| Dashboard \+ màn hình ca trực | C | A, E | B | D7 |
| Kết quả đánh giá AI (số liệu \+ biểu đồ) | E | D | A | D7 |
| Form dùng thử sản phẩm \+ điểm SUS | B | C, E | E | Phát chiều D7, đóng sáng D9 |
| Bản triển khai công khai \+ tài khoản BGK | A | Cả đội | E | D8 |
| Video demo | C | B, D | E | D9 |
| Bộ ấn phẩm (poster QR, infographic, video MXH) | B | C | E | D9 |
| Thuyết minh hoàn chỉnh | E | Cả đội | Cả đội chấm thử | D9 |

# **7\. Lịch 10 ngày và mốc kiểm soát**

Mỗi mốc là một điểm dừng để cả đội kiểm tra điều kiện; không qua mốc thì họp đột xuất 15 phút để dồn người hỗ trợ khối đang trễ (xem phân công dự phòng ở mục 11).

| Ngày | Mốc / họp | A — Backend | B — App SV & khảo sát | C — Dashboard | D — IoT, giả lập & dự báo | E — AI & hồ sơ |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| D1 | Họp 1: khởi động; chốt hợp đồng dữ liệu | Repo, CI, packages/shared (3 hợp đồng, 20 khu vực), CSDL | Thử zmp-ui, chốt bộ UI; wireframe 4 màn hình; soạn form nhu cầu | Wireframe dashboard \+ ca trực; sơ đồ tầng SVG | Broker MQTT; Wokwi "hello MQTT" (ESP32 \+ DHT22 \+ biến trở \+ PIR) | Chủ trì họp 1; bảng việc trên GitHub; dàn ý thuyết minh; duyệt form nhu cầu |
| D2 | Phát form nhu cầu | API khu vực, phản ánh → phiếu, mã tra cứu ngẫu nhiên, đăng nhập theo vai trò; deploy thử | Màn hình QR \+ form phản ánh nối API; phát form nhu cầu | Khung dashboard, đăng nhập, danh sách phiếu | Giả lập v0 (5 giây/điểm, 6 loại sự kiện, xuất CSV); firmware gửi JSON đúng hợp đồng | Module packages/detect: trích đặc trưng, tầng 1 v0 trên CSV v0 |
| D3 | Có dữ liệu 6 tuần v1 | Nhận MQTT; máy trạng thái 6 bước \+ lịch sử; Socket.IO | Trang tra cứu; giới hạn tần suất; nút Khẩn cấp; trang hỗ trợ tĩnh | Chi tiết phiếu, bản điện thoại 3 nút; trạng thái nút trên sơ đồ | Giả lập v1: 6 tuần có nhãn kèm tín hiệu hiện diện, phát trực tiếp, nạp tóm tắt 1 phút vào CSDL | Tầng 1 trên dữ liệu 6 tuần; huấn luyện thử tầng 2 (có đặc trưng hiện diện) |
| D4 | Họp 2: rà soát trước Mốc 1 | Gộp nguồn ±15 phút; SLA \+ chuyển cấp; Web Push (VAPID, đăng ký, gửi) | Lớp Phòng ngừa & Hỗ trợ; Hỗ trợ cai thuốc v1 (tự đánh giá, kế hoạch cai, bộ đếm); nhắc form nhu cầu lần 2 | Trang tổng quan KPI (dữ liệu mẫu), sức khoẻ thiết bị, realtime | Kịch bản demo "22:10" chạy bằng một lệnh; giả lập chạy như worker trên máy chủ | Tầng 1 chạy trong API (cùng A); xuất mô hình tầng 2 |
| D5 | **Mốc 1:** chạy đầu–cuối kịch bản "22:10, B5-CTD"; A gửi clip vào nhóm | Tích hợp, sửa lỗi; API KPI và bản đồ nhiệt; thử Zalo Bot | Cấu hình toà \+ xuất PDF QR hàng loạt; nút "Đang thèm thuốc" và gọi nhanh tổng đài | Bản đồ nhiệt; nối KPI thật; màn hình ca trực đăng ký Web Push | Firmware lưu tạm – gửi bù; client đo độ trễ | LLM báo cáo tuần \+ nhãn ghi chú (có chế độ dự phòng) |
| D6 | Form nhu cầu đợt 1 có kết quả | Sandbox BGK, dữ liệu tự lùi ngày, phân quyền chi tiết | In poster QR; soạn form dùng thử (3 việc \+ SUS \+ câu trước/sau) | Màn hình ca trực đầy đủ; trang dự báo (cùng D); khung infographic (tải ảnh, hiện trên dashboard và app SV, link trình chiếu) | Hiệu chỉnh giả lập theo khảo sát; dự báo \+ lịch tuần tra v1 | Phân tích đợt 1 form nhu cầu; trang Minh bạch thuật toán |
| D7 | Họp 3 \+ **Mốc 2:** đóng băng tính năng 12:00 | Sửa lỗi; chuẩn bị bản công khai | Chiều: phát form dùng thử đợt 1 kèm link sản phẩm | Kiểm thử nội bộ luồng ca trực, sửa lỗi | Đo độ trễ chính thức (≥ 100 lần); mô phỏng độ phủ | Đánh giá chính thức tuần 5–6 \+ 3 bộ độ bền; đóng form nhu cầu; khung thuyết minh |
| D8 | **Mốc 3:** 12:00 chốt giao diện; bản công khai \+ quay video | Triển khai bản cuối, tài khoản BGK, thử từ 4G; SOP \+ quy chế dữ liệu | Sáng: sửa UX theo phản hồi đợt 1; chiều: phát form đợt 2 | Chiều: quay video demo; ảnh chụp màn hình | Kiểm chứng lùi dự báo; BOM, dự toán, chi phí mỗi toà | Ghép các mục thuyết minh; biểu đồ kết quả; kiểm tra kết quả kỳ họp về luật sửa đổi |
| D9 | Họp 4 \+ **Mốc 4:** hồ sơ hoàn chỉnh; 16:00 chấm thử | Rà toàn bộ link, sửa lỗi cuối | Sáng: đóng form dùng thử, tính SUS; infographic; mục Trải nghiệm người dùng | Dựng video, phụ đề; video MXH 30–45 giây | Rà kỹ thuật cùng A; mục Kênh cảm biến | Hoàn thiện thuyết minh; sửa theo chấm thử |
| D10 | Nộp bài | Trực sự cố hệ thống | Kiểm tra định dạng theo mẫu BTC | Chuẩn bị bản video dự phòng | Sao lưu mã nguồn, dữ liệu | Nộp bài; lưu biên nhận |

# **8\. Kiểm chứng thật và đo lường tác động**

## **Form 1 — khảo sát nhu cầu (B thiết kế, E phân tích)**

•       **Đối tượng:** SV ĐHQGHN, ưu tiên SV nội trú; mục tiêu ≥ 100 phản hồi, trong đó ≥ 50 SV nội trú.

•       Google Forms, 5–7 phút, ẩn danh, có câu đồng ý tham gia; không hỏi tên hay mã SV. Phát qua nhóm lớp, nhóm KTX, câu lạc bộ.

•       5 nhóm câu hỏi:

1\.     Mức độ gặp khói thuốc và khí dung thuốc lá điện tử: tần suất, vị trí, khung giờ (dùng để hiệu chỉnh bộ giả lập).

2\.     Hành vi phản ánh hiện nay: đã từng phản ánh chưa, qua kênh nào, vì sao không.

3\.     Mức sẵn sàng dùng QR phản ánh ẩn danh (thang 1–5) và kênh ưa thích (Zalo hay web).

4\.     Mức chấp nhận cảm biến không camera, kể cả cảm biến hiện diện (chỉ biết có/không có người); lo ngại về quyền riêng tư.

5\.     Hiểu biết về quy định (Luật PCTHTL, Nghị quyết 173/2024/QH15); với người đang hút: có muốn được hỗ trợ cai không, muốn hỗ trợ dạng nào (tự theo dõi trên app, tổng đài, gặp y tế trường).

•       **Đầu ra cho thuyết minh:** 4–6 biểu đồ, 3 phát hiện chính, vài ý kiến tiêu biểu.

## **Form 2 — dùng thử sản phẩm (B chủ trì, E phân tích)**

•       Phát chiều D7 (đợt 1\) và chiều D8 (đợt 2, sau khi sửa giao diện) qua cùng các nhóm như Form 1; mục tiêu ≥ 30 phản hồi tổng. Không tổ chức buổi thử nghiệm trực tiếp nào.

•       Form mở đầu bằng link và QR tới sản phẩm đang chạy (link có ?test=1), rồi giao 3 việc tự làm: (1) quét QR mẫu và gửi một phản ánh thử; (2) tra trạng thái bằng mã tra cứu; (3) tìm thông tin hỗ trợ cai thuốc.

•       **Câu hỏi:** hoàn thành từng việc không (có/không); mức sẵn sàng phản ánh khi gặp khói thuốc trước và sau khi dùng thử (thang 1–5); SUS 10 câu bản tiếng Việt; 2 câu mở.

•       Thời gian thao tác lấy từ log ẩn danh của app (mở trang → bấm gửi), không bắt người dùng tự bấm giờ. Phản ánh tạo từ link ?test=1 gắn nhãn test để không lẫn vào số liệu vận hành.

•       **Mốc so sánh SUS:** 68 là điểm trung bình của 500 nghiên cứu; trên 80,3 là hạng A, thuộc nhóm 10% cao nhất (MeasuringU).

•       Ẩn danh, tự nguyện, không thu tên hay mã SV. So sánh đợt 1 với đợt 2 để thấy tác dụng của bản sửa giao diện.

## **Đánh giá trên dữ liệu giả lập (D, E)**

•       **Thuật toán:** tính trên tuần 5–6 và 3 bộ kiểm tra độ bền, ngưỡng đã chốt từ trước.

•       Tách hai con số: **thời gian phát hiện** (từ lúc sự kiện bắt đầu đến lúc gắn cờ) và **độ trễ cảnh báo** (từ lúc gắn cờ đến lúc màn hình ca trực nhận Web Push). Đo ≥ 100 lần bằng client tự ghi giờ nhận, báo trung vị và P95.

•       **Mô phỏng độ phủ:** so "chỉ tuần tra theo lịch cố định" với "cảm biến \+ QR \+ tuần tra theo gợi ý"; chỉ số là % sự kiện được tiếp cận trong 15 phút, chạy 3 mức giả định (bi quan / cơ sở / lạc quan).

## **Khung chỉ số (dùng cho MVP và thí điểm 12 tuần)**

| Cấp | Chỉ số | Mục tiêu | Nguồn dữ liệu | Đo khi nào |
| :---- | :---- | :---- | :---- | :---- |
| Đầu ra | Thời gian gửi một phản ánh (trung vị) | ≤ 30 giây | Log ẩn danh của app trong đợt Form 2 | MVP — thật |
| Đầu ra | Điểm SUS của app SV | ≥ 75; phấn đấu ≥ 80,3 | Form 2 | MVP — thật |
| Đầu ra | Tỷ lệ bắt được sự kiện khói thuốc (recall) | ≥ 90% | Tập kiểm tra giả lập \+ 3 bộ độ bền | MVP — giả lập |
| Đầu ra | Độ chính xác khi báo khói thuốc (precision) | ≥ 85% (chỉ tiêu Vòng 1; ở MVP chỉ kiểm tra logic, báo khoảng kết quả) | Tập kiểm tra giả lập \+ 3 bộ độ bền | MVP — giả lập; thí điểm — thật |
| Đầu ra | Cảnh báo nhầm mỗi nút mỗi ngày | ≤ 1 | Tập kiểm tra giả lập; sau này là dữ liệu thật | MVP — giả lập; thí điểm — thật |
| Đầu ra | Thời gian phát hiện (trung vị) | ≤ 2 phút | Tập kiểm tra giả lập | MVP — giả lập |
| Đầu ra | Độ trễ cảnh báo P95 (gắn cờ → nhận Web Push) | \< 5 giây | Client tự ghi giờ nhận, ≥ 100 lần | MVP |
| Đầu ra | Lượt xem infographic trên app SV và màn hình sảnh | Theo dõi; so sánh trước/sau khi đăng ở toà có điểm nóng | Đếm lượt xem ẩn danh | Thí điểm |
| Kết quả | Mức sẵn sàng phản ánh trước/sau khi dùng thử | Tăng | Form 2 | MVP — thật |
| Kết quả | Tỷ lệ SV sẵn sàng phản ánh qua QR | Lấy làm đường cơ sở | Form 1 | MVP; lặp lại cuối thí điểm |
| Kết quả | Tỷ lệ phiếu đóng đúng hạn 24–48 giờ | ≥ 90% | Lịch sử phiếu | Thí điểm |
| Kết quả | Thời gian ca trực tiếp cận hiện trường (trung vị) | 5–15 phút | Nút "Đã đến" | Thí điểm |
| Kết quả | Số kế hoạch cai được tạo; số lần dùng nút "Đang thèm thuốc" | Theo dõi, không đặt chỉ tiêu | Đếm ẩn danh trên máy chủ (không gửi nội dung kế hoạch) | Thí điểm |
| Tác động | Sự kiện đã xác nhận trên 100 giờ quan sát tại điểm nóng | Giảm so với tuần 1–2 | Dashboard \+ quan sát độc lập | Thí điểm: tuần 8–11 so với tuần 1–2 |
| Tác động | Tỷ lệ SV thấy KTX "không khói thuốc" | Tăng so với đường cơ sở | Khảo sát lặp lại | Đầu và cuối thí điểm |
| Tác động | Số lượt tìm tới hỗ trợ cai thuốc | Theo dõi, không đặt chỉ tiêu | Đếm lượt bấm ẩn danh | Thí điểm |

 

# **9\. Bộ hồ sơ nộp**

## **Dàn ý thuyết minh Vòng 2 (khoảng 16 trang \+ phụ lục)**

1\.     Tóm tắt 1 trang, kèm link và QR tới demo, video (E) — 1 trang

2\.     Vấn đề cần giải quyết: căn cứ pháp lý, số liệu khảo sát thật (E, B) — 1,5 trang

3\.     Mục tiêu, gắn với chỉ số ở mục 8 (E) — 0,5 trang

4\.     Đối tượng tác động: chân dung SV không hút thuốc, SV đang hút, ca trực, BQL (B) — 1 trang

5\.     Giải pháp: mô hình 4 lớp, kiến trúc, tính năng, AI, quyền riêng tư (A, C, D, E) — 4 trang

6\.     Quá trình triển khai 10 ngày: đã làm gì, thử nghiệm gì, sửa gì sau phản hồi (E \+ cả đội) — 1,5 trang

7\.     Kết quả và đánh giá: số đo thật và số đo giả lập, mỗi số ghi rõ điều kiện (E, B, D) — 2,5 trang

8\.     Phương thức triển khai thật: lộ trình 12 tuần, SOP, chuyển sang Zalo và thiết bị thật (A, D) — 1,5 trang

9\.     Nguồn lực và kinh phí: nhân lực, dự toán cập nhật, chi phí duy trì (D) — 1 trang

10\.  Khung đo lường tác động: sơ đồ chuỗi kết quả (đầu vào → hoạt động → đầu ra → kết quả → tác động) \+ bảng chỉ số (E) — 1 trang

11\.  Khả năng nhân rộng: gói triển khai, chi phí mỗi toà, lộ trình KTX → giảng đường → toàn ĐHQGHN → trường khác (D) — 1 trang

12\.  Rủi ro, giới hạn và cam kết đạo đức (A, E) — 0,5 trang

13\.  Phụ lục: ảnh chụp màn hình, phiếu khảo sát, kịch bản thử nghiệm, SOP, link mã nguồn và Wokwi, poster QR

## **Lưu ý khi viết căn cứ pháp lý (E)**

•       Điều 11 Luật PCTHTL 2012 xếp trường cao đẳng, đại học, học viện vào nhóm cấm hút thuốc lá hoàn toàn **trong nhà** (khoản 2, điểm b), không phải toàn bộ khuôn viên (Luật số 09/2012/QH13). Thuyết minh Vòng 1 viết thiếu cụm "trong nhà", nên sửa ở Vòng 2\. Các vị trí thí điểm (hành lang, cầu thang, khu vệ sinh chung) đều ở trong nhà nên căn cứ vẫn vững.

•       Dự án Luật PCTHTL sửa đổi được lùi sang Kỳ họp thứ 2 của Quốc hội, tháng 10/2026 (VOV, 27/07/2026). Bộ Y tế đề xuất mở rộng nhóm cấm hút hoàn toàn trong nhà và trong khuôn viên, có nêu "cơ sở giáo dục" nhưng chưa nói rõ có gồm trường đại học hay không (VnEconomy, 13/01/2026). Trước khi nộp, kiểm tra kết quả kỳ họp; nếu luật đã được thông qua thì trích văn bản mới. Đây cũng là lý do cho thấy giải pháp ra đúng lúc.

•       Nghị quyết 173/2024/QH15 cấm sử dụng thuốc lá điện tử và thuốc lá nung nóng từ năm 2025\. Trích từ văn bản gốc trên cổng thông tin chính thức, không trích qua báo.

## **Kịch bản video demo (mục tiêu 4 phút 20 giây)**

| Thời điểm | Cảnh | Nội dung trên màn hình | Phụ trách |
| :---- | :---- | :---- | :---- |
| 0:00–0:20 | Mở đầu | Cầu thang, hành lang KTX; 1–2 con số nổi bật từ khảo sát | C |
| 0:20–1:30 | "22:10, B5-CTD" | Wokwi vặn biến trở \+ bật PIR → dashboard báo đỏ → điện thoại ca trực nhận Web Push "Có người tại chỗ" → SV quét QR gửi phản ánh → phiếu được gộp | C, D, B |
| 1:30–2:10 | Xử lý khép kín | Ca trực bấm "Đang đến / Đã đến", xác minh; BQL phản hồi; SV nhập mã tra cứu | C |
| 2:10–2:50 | Phòng ngừa & Hỗ trợ | Bản đồ nhiệt nghi vấn/xác nhận, dự báo và lịch tuần tra, báo cáo tuần do AI viết; BQL đăng infographic cho toà điểm nóng; SV đang hút mở Hỗ trợ cai thuốc | E |
| 2:50–3:20 | Bên trong hệ thống | Bộ giả lập 6 loại sự kiện; trang Minh bạch thuật toán | D, E |
| 3:20–3:45 | Bằng chứng thật | Kết quả 2 form khảo sát (nhu cầu; SUS, thời gian gửi) | B |
| 3:45–4:05 | Nhân rộng | Thêm toà mới \+ in QR hàng loạt trong vài phút; lộ trình Zalo Mini App và thiết bị thật | B, A |
| 4:05–4:20 | Kết | Mô hình 4 lớp và lời kêu gọi | E |

 

## **Link và tài khoản cho BGK (A chủ trì, kiểm tra D8 và D10)**

•       Link app SV \+ 1 mã QR mẫu in trong thuyết minh, quét thử được

•       Link dashboard \+ tài khoản BGK (xem dữ liệu, chạy kịch bản trong sandbox tự đặt lại)

•       Hướng dẫn 3 bước cho BGK ngay trên trang đăng nhập: chạy kịch bản, xem phiếu, mở trang Minh bạch thuật toán

•       Tài khoản ca trực demo để BGK tự bật Web Push trên điện thoại và thấy cảnh báo đến (iPhone: thêm vào màn hình chính trước)

•       Dự án Wokwi để công khai

•       Repo GitHub: README có sơ đồ kiến trúc, cách chạy, mô tả dữ liệu giả lập

•       Video demo trên YouTube (chế độ không công khai) \+ bản tải về dự phòng trên Drive

•       Mở thử mọi link từ máy lạ, mạng 4G, cửa sổ ẩn danh

•       Hệ thống chạy liên tục suốt thời gian chấm: máy chủ không "ngủ", bộ giả lập chạy trên máy chủ, dữ liệu tự lùi ngày, có theo dõi uptime

# **10\. Ma trận tiêu chí chấm → bằng chứng**

Mỗi tiêu chí cần ít nhất một bằng chứng BGK tự bấm thấy được trong sản phẩm và một bằng chứng đọc được trong thuyết minh hoặc video. Người chủ trì tiêu chí kiểm tra đủ cả hai trước Mốc 4\.

| Tiêu chí | BGK cần thấy | Bằng chứng trong sản phẩm | Bằng chứng trong thuyết minh / video | Chủ trì |
| :---- | :---- | :---- | :---- | :---- |
| Tính sáng tạo | Cách làm mới, khác biển cấm, tuần tra hay camera | Gộp 2 nguồn tin vào 1 phiếu; AI tách 6 loại sự kiện; dự báo thành lịch tuần tra; firmware chạy trên Wokwi | Mô hình 4 lớp; bảng so sánh với biển cấm, tuần tra, camera, thiết bị phát hiện thuốc lá điện tử thương mại | E |
| Tính phù hợp | Đúng vấn đề, đúng người, đúng bối cảnh ĐHQGHN và quy định | Không camera (cảm biến hiện diện chỉ biết có/không có người), ẩn danh; web app không cần cài; quy trình theo thẩm quyền BQL | Điều 11 Luật PCTHTL và Nghị quyết 173/2024/QH15; số liệu khảo sát ≥ 100 SV | B |
| Tính khả thi | Làm được bằng nguồn lực thật, ít rủi ro | Hệ thống chạy công khai, BGK tự bấm "Chạy kịch bản"; firmware sẵn sàng nạp vào ESP32 thật | Dự toán Vòng 1 (32,8 triệu đồng) cập nhật; lộ trình 12 tuần; SOP; bảng rủi ro; điểm SUS | A, D |
| Hiệu quả dự kiến | Con số cho thấy tốt hơn cách hiện tại | Trang Minh bạch thuật toán; KPI trên dashboard | Recall, precision, cảnh báo nhầm, độ trễ P95; mô phỏng độ phủ ở 3 mức giả định | E, D |
| Khả năng tạo tác động | Tác động rõ tới SV và nhà trường, đo được | Lớp Phòng ngừa & Hỗ trợ; Hỗ trợ cai thuốc (kế hoạch cai, vượt cơn thèm, tổng đài); infographic BQL đăng theo điểm nóng; báo cáo tuần; phản hồi cho người phản ánh | Chuỗi kết quả \+ bảng chỉ số ở mục 8; mức sẵn sàng phản ánh trước/sau khi dùng thử (Form 2\) | E, B |
| Phát triển, nhân rộng | Mở rộng dễ, rẻ, không phụ thuộc nhóm làm ra | Thêm toà \+ in QR hàng loạt trong vài phút; adapter Zalo OA; kiến trúc tách lớp | Gói triển khai (thiết bị, QR, dashboard, SOP, tài liệu đào tạo); chi phí mỗi toà; lộ trình KTX → ĐHQGHN → trường khác; mã nguồn mở | D, A |

 

Chấm thử lúc 16:00 D9: mỗi người chấm độc lập 6 tiêu chí theo thang 10 và ghi một điểm yếu nhất. Tiêu chí nào điểm trung bình dưới 9 thì sửa trước khi nộp.

# **11\. Rủi ro và quy tắc làm việc**

Rủi ro lớn nhất là tích hợp trễ, nên hợp đồng dữ liệu phải chốt ngay D1 và Mốc 1 (D5) là bắt buộc. Mỗi rủi ro có một người theo dõi và báo ngay trong nhóm chat khi thấy dấu hiệu sớm.

| Rủi ro | Dấu hiệu sớm | Phương án | Theo dõi |
| :---- | :---- | :---- | :---- |
| Các khối không khớp khi tích hợp | Hết D3 chưa có bản tin nào chạy qua API | Hợp đồng chốt D1; bộ dữ liệu mẫu cố định để từng khối tự thử; Mốc 1 bắt buộc | A |
| Cảnh báo không tới máy ca trực | Web Push không hiện trên iPhone hoặc trình duyệt chặn thông báo | Hướng dẫn thêm PWA vào màn hình chính; dashboard luôn hiện cảnh báo realtime; Zalo Bot là kênh phụ nếu tạo được | A |
| zmp-ui không chạy ngoài Zalo | Lỗi phụ thuộc zmp-sdk ngay D1 | Chuyển sang Tailwind mô phỏng giao diện Zalo | B |
| Wokwi chập chờn khi quay | Gateway công cộng chậm hoặc rớt kết nối | Quay sẵn một lượt chạy tốt; demo trực tiếp bằng bộ giả lập | D |
| Bộ giả lập dừng hoặc dữ liệu "cũ" lúc BGK chấm | Nút hiện mất kết nối; dự báo chỉ vào tuần đã qua | Giả lập chạy như worker trên máy chủ; dữ liệu tự lùi ngày hằng đêm | D |
| Gói miễn phí "ngủ" hoặc hết hạn mức lúc BGK chấm | Lần mở đầu phải chờ \> 10 giây | Ping giữ thức, theo dõi uptime; nếu cần thuê VPS nhỏ cho tháng chấm | A |
| Thiếu phản hồi form | Form 1 dưới 60 phản hồi vào D5; Form 2 dưới 15 vào sáng D8 | Mỗi người nhờ thêm 2 lớp/nhóm; giữ Form 2 mở tới 9:00 D9 | B |
| BGK nghi ngờ số liệu giả lập | — | Ghi nguồn tham số; tách tập kiểm tra; 3 bộ kiểm tra độ bền; công bố cả kết quả chưa đạt; trang Minh bạch thuật toán | E |
| Lộ khoá bí mật khi để repo công khai | Khoá xuất hiện trong mã hoặc lịch sử commit | Dùng .env, bật quét bí mật của GitHub; khoá riêng cho demo, đổi sau cuộc thi | A |
| Cảm biến hiện diện bị hiểu là "giám sát người" | Câu hỏi hoặc phản đối trong Form 1, Form 2 | Nêu rõ chỉ đo có/không có người, không hình ảnh, không đếm, không nhận dạng; ghi trên poster và trang Minh bạch thuật toán; có thể tắt từng nút | D |
| Nội dung cai thuốc sai chuyên môn | Lời khuyên không có nguồn; số tổng đài sai | Chỉ dùng nguồn chính thống (WHO, Bộ Y tế, tổng đài 1800 6606); nhờ y tế trường duyệt; không tư vấn dùng thuốc | B |
| Infographic không phù hợp hoặc sai thông tin | Ảnh đăng không qua duyệt | Chỉ vai trò BQL được đăng; ghi người đăng và lịch sử; gỡ ngay trên dashboard | C |
| Thành viên quá tải vì lịch học, thi | Một việc trễ quá 1 ngày | Báo ngay trong nhóm chat; người dự phòng nhận bớt việc (C đỡ A; B và C đỡ nhau; D và E đỡ nhau; B đỡ phần hồ sơ của E) | E |

 

## **Quy tắc làm việc**

•       **Họp định kỳ** khoảng 3 ngày/lần, online, 30–45 phút: D1 (khởi động, 60 phút), D4 (rà soát trước Mốc 1), D7 (Mốc 2, đóng băng tính năng), D9 lúc 16:00 (chấm thử, Mốc 4). E chủ trì và cập nhật bảng việc.

•       **Ngày không họp:** mỗi người nhắn 3 dòng vào nhóm chat trước 22:00 — xong gì, làm gì tiếp, đang vướng gì. Vướng quá nửa ngày thì gọi thẳng người liên quan, không chờ buổi họp.

•       Mốc 1 (D5) và Mốc 3 (D8) kiểm tra không cần họp: người chủ trì gửi clip hoặc link làm bằng chứng vào nhóm; không đạt thì họp đột xuất 15 phút.

•       **Công cụ:** GitHub (repo \+ Projects làm bảng việc), nhóm chat của đội, Google Drive cho hồ sơ. Tài liệu này là nguồn duy nhất về phạm vi; muốn thêm bớt thì sửa ở đây.

•       **Git:** nhánh main luôn chạy được; mỗi việc một nhánh và một pull request, người khác duyệt trong ngày; không đẩy thẳng lên main.

•       **"Xong"** nghĩa là: chạy trên bản triển khai thử (không chỉ trên máy mình), đúng hợp đồng dữ liệu, có ảnh hoặc clip ngắn gửi nhóm.

•       **Nhật ký triển khai:** mỗi người ghi 1–2 dòng và một ảnh chụp mỗi ngày vào docs/nhat-ky.md; đây là nguyên liệu cho mục "Quá trình triển khai" của thuyết minh.

•       Dùng AI hỗ trợ code thoải mái, nhưng người sở hữu khối phải đọc hiểu mã để trả lời BGK; không dán khoá bí mật vào prompt.

# **Nguồn**

•       Thuyết minh ý tưởng Vòng 1 — Đội BND, "VNU SmarT-Free Zone" (28/09/2026), file PDF của đội

•       Wokwi – ESP32 WiFi Networking

•       Wokwi – Supported Hardware

•       Wokwi – Custom Chips API, Getting Started

•       Wokwi – PIR Motion Sensor (wokwi-pir-motion-sensor)

•       Fagerström Test for Nicotine Dependence (bản tiếng Việt)

•       Tổng đài tư vấn cai nghiện thuốc lá 1800 6606

•       ZaUI – Installation (Zalo Mini App)

•       Zalo Bot Platform – tài liệu API

•       Digital Policy Alert – Công văn 2312/CVT-CS về chặn Telegram (21/05/2025)

•       PubSubClient – README (giới hạn QoS 0\)

•       Sensirion SPS30 – Datasheet

•       MeasuringU – Measuring Usability with the System Usability Scale

•       Đại biểu Nhân dân – Từ tổng đài tư vấn đến hành trình hỗ trợ người nghiện thuốc lá (03/09/2025)

•       Luật Phòng, chống tác hại của thuốc lá, số 09/2012/QH13

•       VOV – Điều chỉnh Chương trình lập pháp năm 2026 (27/07/2026)

•       VnEconomy – Đề xuất mở rộng khu vực cấm hút thuốc lá hoàn toàn (13/01/2026)

