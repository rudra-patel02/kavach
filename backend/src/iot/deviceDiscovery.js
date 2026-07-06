export const SUPPORTED_EDGE_DEVICES = [
  {
    deviceType: "ESP32",
    protocols: ["MQTT", "REST"],
    sensors: ["temperature", "humidity", "pressure", "current", "voltage", "vibration"],
  },
  {
    deviceType: "ESP8266",
    protocols: ["MQTT", "REST"],
    sensors: ["temperature", "humidity", "vibration"],
  },
  {
    deviceType: "Arduino",
    protocols: ["MQTT", "MODBUS_RTU"],
    sensors: ["temperature", "rpm", "vibration", "oilLevel"],
  },
  {
    deviceType: "Raspberry Pi",
    protocols: ["MQTT", "REST", "MODBUS_TCP", "OPC_UA"],
    sensors: ["temperature", "noise", "flowRate", "gasSensor", "vibration"],
  },
  {
    deviceType: "Industrial Edge Gateway",
    protocols: ["MQTT", "REST", "MODBUS_TCP", "MODBUS_RTU", "OPC_UA"],
    sensors: [
      "temperature",
      "humidity",
      "pressure",
      "current",
      "voltage",
      "rpm",
      "power",
      "energy",
      "oilLevel",
      "vibration",
      "noise",
      "flowRate",
      "gasSensor",
    ],
  },
];

export const getDeviceRegistrationConfig = ({
  apiBaseUrl = process.env.PUBLIC_API_BASE_URL || "http://localhost:5000",
  deviceId,
  machineId,
  mqttBrokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883",
} = {}) => ({
  api: {
    heartbeatEndpoint: `${apiBaseUrl}/api/iot/devices/${deviceId || "{deviceId}"}/heartbeat`,
    telemetryEndpoint: `${apiBaseUrl}/api/iot/telemetry`,
  },
  deviceId: deviceId || "{deviceId}",
  machineId: machineId || "{machineId}",
  mqtt: {
    brokerUrl: mqttBrokerUrl,
    heartbeatTopic: `kavach/device/${deviceId || "{deviceId}"}/heartbeat`,
    registerTopic: "kavach/device/register",
    telemetryTopic: `kavach/device/${deviceId || "{deviceId}"}/telemetry`,
  },
  security: {
    authHeader: "x-device-secret",
    secretRequired: Boolean(process.env.DEVICE_SECRET),
  },
});

export const getFirmwareExamples = () => ({
  arduino: "/backend/firmware/arduino-mqtt-example.ino",
  edgeGateway: "/backend/firmware/industrial-edge-gateway-config.json",
  esp32: "/backend/firmware/esp32-mqtt-example.ino",
  raspberryPi: "/backend/firmware/raspberry-pi-mqtt-example.py",
});
