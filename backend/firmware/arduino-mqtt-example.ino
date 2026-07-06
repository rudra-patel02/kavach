#include <Ethernet.h>
#include <PubSubClient.h>

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress mqttServer(192, 168, 1, 10);
const char* DEVICE_ID = "arduino-001";
const char* MACHINE_ID = "M-102";
const char* DEVICE_SECRET = "replace-with-device-shared-secret";

EthernetClient ethernetClient;
PubSubClient mqtt(ethernetClient);

void reconnect() {
  while (!mqtt.connected()) {
    mqtt.connect(DEVICE_ID);
    delay(1000);
  }
}

void setup() {
  Ethernet.begin(mac);
  mqtt.setServer(mqttServer, 1883);
  reconnect();
}

void loop() {
  if (!mqtt.connected()) {
    reconnect();
  }

  mqtt.loop();

  int rpm = 1450;
  int oilLevel = 82;
  String topic = "kavach/device/" + String(DEVICE_ID) + "/telemetry";
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"machineId\":\"" + String(MACHINE_ID) + "\",";
  payload += "\"rpm\":" + String(rpm) + ",";
  payload += "\"oilLevel\":" + String(oilLevel) + ",";
  payload += "\"deviceSecret\":\"" + String(DEVICE_SECRET) + "\"";
  payload += "}";

  mqtt.publish(topic.c_str(), payload.c_str());
  delay(2000);
}
