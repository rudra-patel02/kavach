# KAVACH Edge Device Examples

These examples show the expected registration, heartbeat, and telemetry shape for KAVACH Phase 11.

Required MQTT topics:

- `kavach/device/register`
- `kavach/device/{deviceId}/heartbeat`
- `kavach/device/{deviceId}/telemetry`
- `kavach/device/{deviceId}/command`

REST alternatives:

- `POST /api/iot/devices/register`
- `POST /api/iot/devices/{deviceId}/heartbeat`
- `POST /api/iot/telemetry`
- `POST /api/iot/sensor` for ESP32 DHT22 temperature and humidity readings

When `DEVICE_SECRET` is set on the backend, send it as `x-device-secret`, a bearer token, or `deviceSecret` in MQTT payloads. Keep WiFi credentials and device secrets outside source control for real devices.

The ESP32 Arduino example posts DHT22 readings every 5 seconds to `/api/iot/sensor`.
