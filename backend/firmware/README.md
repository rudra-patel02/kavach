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

When `DEVICE_SECRET` is set on the backend, send it as `x-device-secret`, a bearer token, or `deviceSecret` in MQTT payloads.
