#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// Định nghĩa chân phần cứng
#define DHTPIN 15
#define DHTTYPE DHT22
#define POT_PIN 34       // Biến trở giả lập cảm biến tán xạ quang học bụi mịn SPS30 (0-4095)
#define PIR_PIN 13       // Cảm biến chuyển động hồng ngoại thụ động (PIR Motion Sensor)
#define BUZZER_PIN 23    // Còi chíp cảnh báo tại chỗ khi khói vượt ngưỡng
#define LED_PIN 2        // Đèn LED báo trạng thái kết nối

// Cấu hình mạng WiFi mô phỏng Wokwi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Cấu hình MQTT Broker
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "sfz-esp32-node-b5ctd";
const char* mqtt_topic_telemetry = "sfz/uet/UET1-3CT/telemetry";
const char* mqtt_topic_status = "sfz/uet/UET1-3CT/status";

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Biến trạng thái
unsigned long lastMsgTime = 0;
unsigned long lastPIRDetectionTime = 0;
long seqNumber = 1000;
const int TELEMETRY_INTERVAL_MS = 5000; // Chu kỳ phát 5 giây/lần theo hợp đồng

// Bộ đệm lưu trữ tạm thời khi mất kết nối mạng (Offline buffer)
struct OfflinePacket {
  long seq;
  float pm25;
  float temp;
  float rh;
  bool presence;
  unsigned long timestamp_sec;
};
OfflinePacket offlineBuffer[20];
int offlineCount = 0;

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("[WiFi] Đang kết nối tới: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Đã kết nối thành công!");
    Serial.print("[WiFi] Địa chỉ IP: ");
    Serial.println(WiFi.localIP());
    digitalWrite(LED_PIN, HIGH);
  } else {
    Serial.println("\n[WiFi] Không thể kết nối. Chuyển sang chế độ lưu đệm Offline.");
  }
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("[MQTT] Đang thử kết nối broker...");
    if (client.connect(mqtt_client_id)) {
      Serial.println(" Thành công!");
      // Gửi bản tin Heartbeat Online
      StaticJsonDocument<128> doc;
      doc["node_id"] = "UET1-3CT";
      doc["status"] = "online";
      doc["fw"] = "0.3.0";
      doc["ip"] = WiFi.localIP().toString();
      char buffer[128];
      serializeJson(doc, buffer);
      client.publish(mqtt_topic_status, buffer);

      // Gửi bù các bản tin trong bộ nhớ đệm (Flush offline buffer)
      if (offlineCount > 0) {
        Serial.printf("[Buffer] Bắt đầu gửi bù %d bản tin tồn đọng...\n", offlineCount);
        for (int i = 0; i < offlineCount; i++) {
          StaticJsonDocument<256> bDoc;
          bDoc["node_id"] = "UET1-3CT";
          bDoc["seq"] = offlineBuffer[i].seq;
          bDoc["pm25"] = offlineBuffer[i].pm25;
          bDoc["temp"] = offlineBuffer[i].temp;
          bDoc["rh"] = offlineBuffer[i].rh;
          bDoc["presence"] = offlineBuffer[i].presence;
          bDoc["late"] = true; // Đánh dấu bản tin gửi bù
          bDoc["fw"] = "0.3.0";
          char bBuffer[256];
          serializeJson(bDoc, bBuffer);
          client.publish(mqtt_topic_telemetry, bBuffer);
          delay(50);
        }
        offlineCount = 0;
      }
    } else {
      Serial.print(" Thất bại, rc=");
      Serial.print(client.state());
      Serial.println(" Thử lại sau 3 giây...");
      delay(3000);
      break;
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  dht.begin();
  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);
  Serial.println("=================================================");
  Serial.println(" [SFZ Firmware v0.3.0] ESP32 Smoke Sensor Node");
  Serial.println(" Nút giám sát: UET1-3CT (Chiếu nghỉ F3 toà UET1)");
  Serial.println("=================================================");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      reconnect_mqtt();
    }
    client.loop();
  }

  // Đọc cảm biến chuyển động hồng ngoại PIR
  bool currentPIR = digitalRead(PIR_PIN);
  if (currentPIR) {
    lastPIRDetectionTime = millis();
  }
  int presenceAgeSeconds = (millis() - lastPIRDetectionTime) / 1000;

  unsigned long now = millis();
  if (now - lastMsgTime > TELEMETRY_INTERVAL_MS) {
    lastMsgTime = now;
    seqNumber++;

    // 1. Đọc cảm biến nhiệt độ & độ ẩm DHT22
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();
    if (isnan(humidity) || isnan(temperature)) {
      humidity = 65.0;
      temperature = 28.0;
    }

    // 2. Đọc biến trở giả lập cảm biến tán xạ quang học SPS30
    int potValue = analogRead(POT_PIN); // 0 - 4095
    // Ánh xạ sang nồng độ PM2.5 (ug/m3): Mức nền 5 - 15, khi vặn biến trở vọt lên 35 - 150
    float pm25 = map(potValue, 0, 4095, 8, 160);
    float pm1 = pm25 * 0.7;
    float pm10 = pm25 * 1.15;
    float nc = pm25 * 12.0;
    float typ_size = 0.42;

    // 3. Cảnh báo tại chỗ qua còi Buzzer nếu nồng độ khói vượt ngưỡng khẩn cấp (> 60 ug/m3)
    if (pm25 >= 60.0) {
      digitalWrite(BUZZER_PIN, HIGH);
    } else {
      digitalWrite(BUZZER_PIN, LOW);
    }

    // 4. Đóng gói JSON theo đúng Hợp đồng 1 (Telemetry Contract)
    StaticJsonDocument<300> doc;
    doc["node_id"] = "UET1-3CT";
    doc["seq"] = seqNumber;
    doc["pm1"] = round(pm1 * 10) / 10.0;
    doc["pm25"] = round(pm25 * 10) / 10.0;
    doc["pm10"] = round(pm10 * 10) / 10.0;
    doc["nc"] = round(nc);
    doc["typ_size"] = typ_size;
    doc["temp"] = round(temperature * 10) / 10.0;
    doc["rh"] = round(humidity * 10) / 10.0;
    doc["presence"] = currentPIR;
    doc["presence_age"] = presenceAgeSeconds;
    doc["rssi"] = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -99;
    doc["fw"] = "0.3.0";
    doc["late"] = false;

    char jsonBuffer[300];
    serializeJson(doc, jsonBuffer);

    if (client.connected()) {
      client.publish(mqtt_topic_telemetry, jsonBuffer);
      Serial.printf("[Telemetry Sent] Seq: %ld | PM2.5: %.1f ug/m3 | PIR: %s | Còi: %s\n",
                    seqNumber, pm25, currentPIR ? "Có người" : "Không", pm25 >= 60.0 ? "BẬT" : "Tắt");
    } else {
      // Mất mạng -> Lưu vào bộ nhớ đệm
      if (offlineCount < 20) {
        offlineBuffer[offlineCount].seq = seqNumber;
        offlineBuffer[offlineCount].pm25 = pm25;
        offlineBuffer[offlineCount].temp = temperature;
        offlineBuffer[offlineCount].rh = humidity;
        offlineBuffer[offlineCount].presence = currentPIR;
        offlineBuffer[offlineCount].timestamp_sec = now / 1000;
        offlineCount++;
        Serial.printf("[Offline Buffer] Đã lưu bản tin %ld vào bộ đệm (Hiện có %d bản tin)\n", seqNumber, offlineCount);
      }
    }
  }
}
