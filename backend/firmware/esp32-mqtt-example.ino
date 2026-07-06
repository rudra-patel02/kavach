#include <WiFi.h>
#include <PubSubClient.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* MQTT_HOST = "192.168.1.10";
const int MQTT_PORT = 1883;
const char* DEVICE_SECRET = "replace-with-device-shared-secret";
const char* DEVICE_ID = "esp32-001";
const char* MACHINE_ID = "M-101";

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);
unsigned long lastPublish = 0;

void connectWifi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void connectMqtt() {
  while (!mqtt.connected()) {
    mqtt.connect(DEVICE_ID);
    delay(1000);
  }
}

void publishRegistration() {
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"machineId\":\"" + String(MACHINE_ID) + "\",";
  payload += "\"deviceType\":\"ESP32\",";
  payload += "\"firmwareVersion\":\"1.0.0\",";
  payload += "\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\",";
  payload += "\"supportedSensors\":[\"temperature\",\"humidity\",\"pressure\",\"current\",\"voltage\",\"vibration\"]";
  payload += "}";
  mqtt.publish("kavach/device/register", payload.c_str(), true);
}

void publishHeartbeat() {
  String topic = "kavach/device/" + String(DEVICE_ID) + "/heartbeat";
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"batteryLevel\":96,";
  payload += "\"signalStrength\":" + String(WiFi.RSSI()) + ",";
  payload += "\"healthStatus\":\"healthy\",";
  payload += "\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\"";
  payload += "}";
  mqtt.publish(topic.c_str(), payload.c_str());
}

void publishTelemetry() {
  float temperature = 62.4;
  float humidity = 38.0;
  float pressure = 5.2;
  float current = 8.5;
  float voltage = 229.0;
  float vibration = 1.6;
  String topic = "kavach/device/" + String(DEVICE_ID) + "/telemetry";
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"machineId\":\"" + String(MACHINE_ID) + "\",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"humidity\":" + String(humidity, 1) + ",";
  payload += "\"pressure\":" + String(pressure, 2) + ",";
  payload += "\"current\":" + String(current, 2) + ",";
  payload += "\"voltage\":" + String(voltage, 1) + ",";
  payload += "\"vibration\":" + String(vibration, 2) + ",";
  payload += "\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\"";
  payload += "}";
  mqtt.publish(topic.c_str(), payload.c_str());
}

void setup() {
  connectWifi();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  connectMqtt();
  publishRegistration();
}

void loop() {
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();

  if (millis() - lastPublish > 2000) {
    publishHeartbeat();
    publishTelemetry();
    lastPublish = millis();
  }
}
