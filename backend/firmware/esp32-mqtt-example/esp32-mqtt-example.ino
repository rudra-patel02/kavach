#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <WiFi.h>

const char* WIFI_SSID = "Rudra N's iPhone";
const char* WIFI_PASSWORD = "12345678990";
const char* BACKEND_SENSOR_URL = "http://172.20.10.14:5000/api/iot/sensor";
const char* DEVICE_ID = "esp32-dht11-01";

#define DHT_PIN 4
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorRead = 0;
unsigned long lastWifiRetry = 0;
const unsigned long SENSOR_INTERVAL_MS = 5000;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 10000;

String wifiStatusText(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "WL_IDLE_STATUS";
    case WL_NO_SSID_AVAIL:
      return "WL_NO_SSID_AVAIL";
    case WL_SCAN_COMPLETED:
      return "WL_SCAN_COMPLETED";
    case WL_CONNECTED:
      return "WL_CONNECTED";
    case WL_CONNECT_FAILED:
      return "WL_CONNECT_FAILED";
    case WL_CONNECTION_LOST:
      return "WL_CONNECTION_LOST";
    case WL_DISCONNECTED:
      return "WL_DISCONNECTED";
    default:
      return "UNKNOWN_STATUS";
  }
}

void printWifiStatus(const char* label) {
  wl_status_t status = WiFi.status();

  Serial.print(label);
  Serial.print(" WiFi.status()=");
  Serial.print(status);
  Serial.print(" (");
  Serial.print(wifiStatusText(status));
  Serial.println(")");
}

void scanWifiNetworks() {
  Serial.println();
  Serial.println("Scanning WiFi networks...");

  int networkCount = WiFi.scanNetworks();

  if (networkCount <= 0) {
    Serial.println("No WiFi networks found.");
    return;
  }

  Serial.print("Networks found: ");
  Serial.println(networkCount);

  bool targetFound = false;

  for (int i = 0; i < networkCount; i++) {
    String ssid = WiFi.SSID(i);

    if (ssid == WIFI_SSID) {
      targetFound = true;
    }

    Serial.print(i + 1);
    Serial.print(". ");
    Serial.print(ssid);
    Serial.print("  RSSI: ");
    Serial.print(WiFi.RSSI(i));
    Serial.print(" dBm  Channel: ");
    Serial.print(WiFi.channel(i));
    Serial.print("  Encryption: ");
    Serial.println(WiFi.encryptionType(i) == WIFI_AUTH_OPEN ? "open" : "secured");
  }

  Serial.print("Target SSID \"");
  Serial.print(WIFI_SSID);
  Serial.print("\" ");
  Serial.println(targetFound ? "found." : "not found.");
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  printWifiStatus("Before reconnect:");

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(1000);

  scanWifiNetworks();

  Serial.println();
  Serial.print("Connecting to WiFi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    Serial.print(".");
    printWifiStatus(" connect attempt:");
    delay(1000);
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    printWifiStatus("WiFi connection failed:");
    Serial.println("Will retry WiFi connection in 10 seconds.");
  }
}

void maintainWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  unsigned long now = millis();

  if (now - lastWifiRetry < WIFI_RETRY_INTERVAL_MS) {
    return;
  }

  lastWifiRetry = now;
  Serial.println();
  Serial.println("WiFi disconnected. Retrying connection...");
  connectWifi();
}

void sendSensorReading(float temperature, float humidity) {
  if (WiFi.status() != WL_CONNECTED) {
    printWifiStatus("Skipping HTTP POST because WiFi is disconnected:");
    return;
  }

  StaticJsonDocument<200> doc;

  doc["deviceId"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;

  String json;
  serializeJson(doc, json);

  HTTPClient http;

  http.begin(BACKEND_SENSOR_URL);
  http.addHeader("Content-Type", "application/json");

  Serial.println("Sending Data...");
  Serial.println(json);

  int httpCode = http.POST(json);

  Serial.print("HTTP Code: ");
  Serial.println(httpCode);

  String response = http.getString();

  Serial.print("Response: ");
  Serial.println(response);

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  dht.begin();

  connectWifi();
}

void loop() {
  maintainWifi();

  if (millis() - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = millis();

    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature();

    if (isnan(humidity) || isnan(temperature)) {
      Serial.println("Failed to read DHT11.");
      return;
    }

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.print(" C  Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");

    sendSensorReading(temperature, humidity);
  }
}
