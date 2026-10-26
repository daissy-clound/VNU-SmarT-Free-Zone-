# Thiết kế Firmware & Mạch Mô phỏng ESP32 — VNU SmarT-Free Zone

## 1. Đường dẫn dự án Wokwi trực tiếp (Live Simulation)
- **Link Wokwi Dự án:** [https://wokwi.com/projects/478273736679993345](https://wokwi.com/projects/478273736679993345)
- **Trạng thái:** Công khai (Public), sẵn sàng cho Ban Giám khảo bấm chạy trực tiếp trên trình duyệt.

## 2. Cấu hình phần cứng mô phỏng
1. **Vi điều khiển chính:** ESP32 DevKit C V4 (38 chân, 2 lõi 240 MHz, tích hợp Wi-Fi/BLE).
2. **Cảm biến nhiệt độ & độ ẩm:** DHT22 kết nối chân GPIO 15.
3. **Cảm biến khói quang học (Giả lập SPS30 Sensirion):** Biến trở Potentiometer kết nối chân ADC GPIO 34 (0 - 4095, ánh xạ sang PM2.5 từ 8 đến 160 µg/m³).
4. **Cảm biến chuyển động hồng ngoại thụ động (PIR):** HC-SR501 kết nối chân GPIO 13 (đo lường `presence` và tính `presence_age`).
5. **Còi cảnh báo tại chỗ (Buzzer):** Kích hoạt chân GPIO 23 khi nồng độ khói vượt ngưỡng khẩn cấp (PM2.5 ≥ 60 µg/m³).
6. **Đèn LED trạng thái:** GPIO 2 (Sáng xanh khi kết nối Wi-Fi & MQTT thành công).

## 3. Các tính năng nổi bật của Firmware
- **Giao thức MQTT:** Kết nối broker chuẩn `broker.hivemq.com` qua cổng 1883, topic `sfz/uet/UET1-3CT/telemetry`.
- **Chu kỳ phát:** Đóng gói JSON chuẩn Hợp đồng 1 mỗi 5 giây (`seq`, `pm1`, `pm25`, `pm10`, `nc`, `typ_size`, `temp`, `rh`, `presence`, `presence_age`).
- **Cơ chế lưu đệm Offline (Late-sending buffer):** Khi mất kết nối Wi-Fi hoặc ngắt mạng, vi điều khiển tự động lưu tối đa 20 bản tin vào mảng nhớ đệm RAM. Khi mạng phục hồi, firmware tự động phát bù toàn bộ các bản tin với cờ `"late": true` kèm đúng mốc thời gian gốc.
- **Sẵn sàng nạp thiết bị thật:** Khi triển khai thực địa, chỉ cần thay đổi driver ADC sang thư viện `sps30.h` qua chuẩn giao tiếp I2C (SDA 21, SCL 22). Toàn bộ logic cảnh báo và MQTT giữ nguyên 100%.
