#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

const char* WIFI_SSID = "YOUR_WIFI";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";
const char* BACKEND_SENSOR_URL = "http://192.168.1.10:5000/api/iot/sensor";
const char* DEVICE_ID = "esp32-dht11-01";

const int DHT_PIN = 4;
const int DHT_TYPE = DHT11;
const unsigned long SENSOR_INTERVAL_MS = 5000;

DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSensorRead = 0;

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("Connecting to Wi-Fi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }

  Serial.println();
  Serial.print("Wi-Fi connected. IP address: ");
  Serial.println(WiFi.localIP());
}

void sendSensorReading(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting before POST...");
    connectWifi();
  }

  StaticJsonDocument<160> payload;
  payload["deviceId"] = DEVICE_ID;
  payload["temperature"] = temperature;
  payload["humidity"] = humidity;

  String requestBody;
  serializeJson(payload, requestBody);

  HTTPClient http;
  http.begin(BACKEND_SENSOR_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.print("POST ");
  Serial.println(BACKEND_SENSOR_URL);
  Serial.print("Payload: ");
  Serial.println(requestBody);

  int responseCode = http.POST(requestBody);
  String responseBody = http.getString();

  Serial.print("HTTP response code: ");
  Serial.println(responseCode);
  Serial.print("HTTP response body: ");
  Serial.println(responseBody);

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();
  connectWifi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
  }

  unsigned long now = millis();

  if (now - lastSensorRead < SENSOR_INTERVAL_MS) {
    return;
  }

  lastSensorRead = now;

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT11 sensor.");
    return;
  }

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.print(" C, Humidity: ");
  Serial.print(humidity);
  Serial.println("%");

  sendSensorReading(temperature, humidity);
}
