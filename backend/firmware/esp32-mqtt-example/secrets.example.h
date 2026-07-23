#pragma once

// Copy this file to secrets.h and set values for the deployed backend.
// DEVICE_SECRET must exactly match the backend DEVICE_SECRET environment variable.
#define WIFI_SSID "replace-with-wifi-ssid"
#define WIFI_PASSWORD "replace-with-wifi-password"
#define BACKEND_SENSOR_URL "https://kavach-spgh.onrender.com/api/iot/sensor"
#define DEVICE_ID "esp32-dht22-01"
#define DEVICE_SECRET "replace-with-render-device-secret"
