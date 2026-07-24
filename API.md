# KAVACH API Reference

This document summarizes the production REST and Socket.IO contract. The backend also serves Swagger UI at `/api/docs` and OpenAPI JSON at `/api/docs/openapi.json`.

Current backend API base URL:

```text
https://kavach-spgh.onrender.com
```

All REST paths below are relative to:

```text
https://kavach-spgh.onrender.com/api
```

## Authentication

Most endpoints require a JWT access token:

```http
Authorization: Bearer <access-token>
```

Login returns an access token, refresh token, and user payload.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@kavach.com",
  "password": "admin123"
}
```

Frontend clients store and attach the token through `frontend/lib/api.ts`.

## Response Conventions

Successful responses are JSON unless the route is an export/download endpoint.

Error responses generally include:

```json
{
  "success": false,
  "message": "Human-readable error"
}
```

Common status codes:

| Status | Meaning |
| --- | --- |
| 200 | Success |
| 201 | Created |
| 202 | Accepted |
| 204 | Empty success or preflight success |
| 400 | Invalid request |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict |
| 429 | Rate limit or brute force protection |
| 500 | Server error |

## CORS

Production backend CORS allows:

```text
Origin: https://your-frontend-origin.example
Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Headers: Content-Type, Authorization
Credentials: enabled when CORS_CREDENTIALS=true
```

## Public Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Public health check |
| GET | `/api/docs` | Swagger UI |
| GET | `/api/docs/openapi.json` | OpenAPI JSON |
| GET | `/` | Backend service metadata |

## Auth Endpoints

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout and clear refresh state |

## Machines

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/machines` | List machines |
| GET | `/api/machines/lookup/:code` | Lookup by QR, barcode, serial, machine id, or linked device id |
| GET | `/api/machines/:id` | Get machine by id |
| POST | `/api/machines` | Create machine |
| PUT | `/api/machines/:id` | Update machine |
| DELETE | `/api/machines/:id` | Delete machine |

Example create payload:

```json
{
  "machineId": "MACHINE-001",
  "name": "Press Line 1",
  "department": "Production",
  "status": "Running"
}
```

## Analytics and Predictive Maintenance

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/analytics/overview` | Analytics overview |
| GET | `/api/analytics/export.csv` | Export analytics CSV |
| GET | `/api/predictive/overview` | Predictive overview |
| POST | `/api/predictive/simulate` | Run what-if simulation without persisting machine state |
| GET | `/api/predictive/:machineId` | Machine prediction detail |

Example simulation payload:

```json
{
  "machineId": "MACHINE-001",
  "name": "Temperature Increase",
  "eventType": "temperature_increase",
  "overrides": {
    "temperature": 92,
    "vibration": 0.9,
    "power": 620
  }
}
```

Simulation responses include baseline prediction, simulated prediction, risk delta, RUL delta, downtime delta, affected machines, estimated downtime, financial impact, operational impact, risk level, and recommended actions. Simulations do not persist machine state.

## AI and Copilot

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/ai/overview` | AI summary |
| GET | `/api/ai/fleet-health` | AI fleet health |
| GET | `/api/ai/executive-insights` | Executive AI insights |
| GET | `/api/ai/history` | AI history |
| GET | `/api/ai/machine/:machineId` | Machine intelligence |
| POST | `/api/ai/machine/:machineId/analyze` | Run machine analysis |
| GET | `/api/ai/planner/:machineId` | Maintenance planning |
| POST | `/api/copilot/chat` | Copilot chat |
| GET | `/api/copilot/report` | Copilot report |

Copilot plant-context questions are answered from current project data. Supported examples include most-critical machine, production decrease, maintenance priority, and plant health summary.

## Work Orders

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/workorders` | List work orders |
| GET | `/api/workorders/stats` | Work order statistics |
| GET | `/api/workorders/export` | Export work orders |
| GET | `/api/workorders/export/:format` | Export as `csv`, `excel`, or `pdf` |
| GET | `/api/workorders/:id` | Get work order |
| GET | `/api/workorders/:id/print` | Printable work order |
| POST | `/api/workorders` | Create work order |
| PUT | `/api/workorders/:id` | Replace work order |
| PATCH | `/api/workorders/:id` | Update work order |
| PATCH | `/api/workorders/:id/status` | Update status |
| PATCH | `/api/workorders/:id/assign` | Assign work order |
| PATCH | `/api/workorders/:id/complete` | Complete work order |
| DELETE | `/api/workorders/:id` | Delete work order |

## Enterprise Operations

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/enterprise/dashboard` | Enterprise dashboard |
| GET | `/api/enterprise/fleet` | Fleet intelligence |
| GET | `/api/enterprise/analytics/cross-plant` | Cross-plant analytics |
| GET | `/api/enterprise/admin/console` | Admin console |
| GET | `/api/enterprise/tenants` | List tenants |
| POST | `/api/enterprise/tenants` | Create tenant |
| GET | `/api/enterprise/organizations` | List organizations |
| POST | `/api/enterprise/organizations` | Create organization |
| GET | `/api/enterprise/organizations/:id` | Get organization |
| PATCH | `/api/enterprise/organizations/:id` | Update organization |
| PUT | `/api/enterprise/organizations/:id` | Replace organization fields |
| DELETE | `/api/enterprise/organizations/:id` | Delete organization |
| PATCH | `/api/enterprise/organizations/:id/settings` | Update organization settings |
| PATCH | `/api/enterprise/organizations/:id/branding` | Update branding |
| GET | `/api/enterprise/regions` | List regions |
| POST | `/api/enterprise/regions` | Create region |
| GET | `/api/enterprise/plants` | List plants |
| POST | `/api/enterprise/plants` | Create plant |
| GET | `/api/enterprise/plants/:id` | Get plant |
| PATCH | `/api/enterprise/plants/:id` | Update plant |
| PUT | `/api/enterprise/plants/:id` | Replace plant fields |
| DELETE | `/api/enterprise/plants/:id` | Delete plant |
| GET | `/api/enterprise/areas` | List areas |
| POST | `/api/enterprise/areas` | Create area |
| GET | `/api/enterprise/assets` | List assets |
| POST | `/api/enterprise/assets` | Create asset |
| PATCH | `/api/enterprise/assets/:assetId/lifecycle` | Update asset lifecycle |
| GET | `/api/enterprise/engineers` | List engineers |
| POST | `/api/enterprise/engineers` | Create engineer |
| PATCH | `/api/enterprise/users/:userId/role` | Assign enterprise role |
| GET | `/api/enterprise/invitations` | List invitations |
| POST | `/api/enterprise/invitations` | Create invitation |
| PATCH | `/api/enterprise/invitations/:invitationId/revoke` | Revoke invitation |
| POST | `/api/enterprise/workorders/:workOrderId/auto-assign` | Auto-assign work order |
| GET | `/api/enterprise/alerts` | Enterprise alerts |
| POST | `/api/enterprise/alerts/:id/comments` | Comment on alert |
| GET | `/api/enterprise/notification-rules` | List notification rules |
| POST | `/api/enterprise/notification-rules` | Create notification rule |
| GET | `/api/enterprise/report-schedules` | List report schedules |
| POST | `/api/enterprise/report-schedules` | Create report schedule |
| GET | `/api/enterprise/audit` | Enterprise audit |
| GET | `/api/enterprise/onboarding` | Onboarding progress |
| PATCH | `/api/enterprise/onboarding` | Update onboarding |
| POST | `/api/enterprise/onboarding/complete` | Complete onboarding |
| GET | `/api/enterprise/onboarding/:organizationId` | Organization onboarding |
| PATCH | `/api/enterprise/onboarding/:organizationId` | Update organization onboarding |
| POST | `/api/enterprise/onboarding/:organizationId/complete` | Complete organization onboarding |
| GET | `/api/enterprise/demo/configuration` | Demo configuration |
| POST | `/api/enterprise/demo/generate` | Generate demo data |
| POST | `/api/enterprise/demo/reset` | Reset demo data |

## Tenants

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/tenants` | Tenant hierarchy overview |
| POST | `/api/tenants/organizations` | Create organization |
| POST | `/api/tenants/plants` | Create plant |
| POST | `/api/tenants/switch-plant` | Switch active plant |

Additional tenant patch/post routes manage organization, plant, region, and area hierarchy actions.

## Users and Settings

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/users` | List users and roles |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/settings` | Read current user settings |
| PATCH | `/api/settings/profile` | Update profile |
| PATCH | `/api/settings/password` | Update password |
| PATCH | `/api/settings/preferences` | Update preferences |

## Notifications and Alerts

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications` | Create notification |
| GET | `/api/notifications/preferences` | Read preferences |
| PATCH | `/api/notifications/preferences` | Update preferences |
| GET | `/api/notifications/push/status` | Read PWA push subscription status |
| POST | `/api/notifications/push/subscribe` | Register browser push subscription |
| POST | `/api/notifications/push/unsubscribe` | Disable browser push subscription |
| POST | `/api/notifications/push/preview` | Preview web push delivery payload |
| PATCH | `/api/notifications/read` | Mark all read |
| PATCH | `/api/notifications/archive` | Archive bulk notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification read |
| PATCH | `/api/notifications/:id/archive` | Archive notification |
| DELETE | `/api/notifications` | Clear notifications |
| DELETE | `/api/notifications/:id` | Delete notification |

## Audit, Reports, Backup, and System

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/audit` | Audit log search |
| GET | `/api/audit/export` | Export audit logs |
| GET | `/api/audit/export/:format` | Export audit as `csv`, `excel`, or `pdf` |
| GET | `/api/reports` | Report catalog |
| GET | `/api/reports/automation/status` | Automated report delivery status |
| POST | `/api/reports/automation/run-due` | Run due report schedules |
| POST | `/api/reports/generate` | Generate report |
| GET | `/api/reports/:type` | Generate report by type |
| GET | `/api/reports/:type/pdf` | Download report PDF |
| GET | `/api/backup/export` | Export backup |
| POST | `/api/backup/restore` | Restore backup |
| GET | `/api/backup/logs` | Backup logs |
| GET | `/api/backup/configuration` | Backup configuration |
| POST | `/api/backup/configuration` | Update backup configuration |
| GET | `/api/system/health` | Authenticated system diagnostics |
| GET | `/api/search?q=<query>` | Global search |

## Billing

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/billing/plans` | List plans |
| GET | `/api/billing/subscription` | Current subscription |
| POST | `/api/billing/subscription` | Update subscription |

## IoT

Device routes use device authentication with `DEVICE_SECRET`.

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/iot/devices/register` | Register device |
| POST | `/api/iot/telemetry` | Ingest telemetry |
| POST | `/api/iot/devices/:deviceId/heartbeat` | Device heartbeat |
| GET | `/api/iot` | IoT overview |
| GET | `/api/iot/devices` | List devices |
| GET | `/api/iot/devices/:deviceId` | Device detail |
| GET | `/api/iot/devices/:deviceId/config` | Device onboarding config and firmware links |
| GET | `/api/iot/devices/:deviceId/telemetry` | Device telemetry history |
| POST | `/api/iot/devices/:deviceId/command` | Publish MQTT device command |

Telemetry payload shape:

```json
{
  "deviceId": "edge-001",
  "machineId": "MACHINE-001",
  "temperature": 54.2,
  "vibration": 0.02,
  "pressure": 2.1,
  "voltage": 230,
  "current": 12,
  "energy": 28.4,
  "timestamp": "2026-07-13T10:00:00.000Z"
}
```

## Smart Factory, Digital Twin, and AI Vision

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/smart-factory/integrations` | MQTT, OPC UA, Modbus, PLC, REST protocol readiness |
| GET | `/api/smart-factory/twin` | Smart Factory digital twin state |
| GET | `/api/smart-factory/vision` | AI Vision overview |
| GET | `/api/smart-factory/vision/cameras` | Camera dashboard |
| POST | `/api/smart-factory/vision/cameras` | Create or update AI Vision camera |
| PATCH | `/api/smart-factory/vision/cameras/:cameraId/status` | Update camera status |
| GET | `/api/smart-factory/vision/timeline` | AI Vision event timeline |
| POST | `/api/smart-factory/vision/events` | Ingest PPE/fire/smoke/intrusion event |
| PATCH | `/api/smart-factory/vision/events/:eventId/status` | Acknowledge, resolve, suppress, or reopen event |

AI Vision event payload:

```json
{
  "cameraId": "CAM-01",
  "eventType": "PPE",
  "machineId": "MACHINE-001",
  "severity": "High",
  "detections": [
    {
      "label": "missing-hardhat",
      "confidence": 91.4,
      "severity": "High",
      "boundingBox": { "x": 120, "y": 40, "w": 80, "h": 160 }
    }
  ],
  "snapshotUrl": "https://example.com/snapshot.jpg"
}
```

AI Vision events also create compatible `safety_warning` notifications for the existing alert center and push flows.

## Enterprise AI UI Surfaces

The following enterprise features are implemented through existing data and APIs rather than new standalone backend route groups:

| Feature | Primary UI | Backend Data Used |
| --- | --- | --- |
| AI Scenario Simulator | `/predictive` | `/api/predictive/simulate`, current machine telemetry |
| Autonomous AI Control Center | dashboard | live machine feed, health, temperature, vibration, status |
| Executive Digital War Room | `/dashboard/executive` | `/api/executive/dashboard` |
| AI Incident Investigation | `/predictive` | predictive overview and root cause data |
| Plant Efficiency Optimizer | `/predictive` | predictive overview, energy, efficiency, maintenance ranking |

## Socket.IO

Current Socket.IO base:

```text
https://kavach-spgh.onrender.com/socket.io
```

Client configuration:

```js
io("https://your-backend-service.onrender.com", {
  path: "/socket.io",
  transports: ["websocket", "polling"]
});
```

Client-to-server events:

| Event | Payload | Description |
| --- | --- | --- |
| `plant:join` | `{ "plantId": "default" }` | Join plant room |
| `plant:leave` | `{ "plantId": "default" }` | Leave plant room |
| `machine:join` | `{ "machineId": "MACHINE-001" }` | Join machine room |
| `machine:leave` | `{ "machineId": "MACHINE-001" }` | Leave machine room |
| `plant:heartbeat:ack` | heartbeat payload | Acknowledge heartbeat |

Server-to-client events:

| Event | Description |
| --- | --- |
| `hello` | Sent after connection |
| `plant:heartbeat` | Periodic heartbeat |
| `plant:heartbeat:ack` | Join acknowledgement |
| `machineUpdate` | Legacy machine update array |
| `machines:update` | Machine snapshot update |
| `machine:update` | Single machine update |
| `predictive:overview` | Predictive overview update |
| `prediction:update` | Prediction update |
| `ai:insights` | AI insights update |
| `ai:intelligence:update` | AI intelligence update |
| `ai:anomaly` | AI anomaly event |
| `ai:forecast:update` | AI forecast update |
| `ai:maintenance-plan:update` | AI maintenance plan update |
| `telemetry:update` | IoT telemetry update |
| `device:online` | Device online |
| `device:offline` | Device offline |
| `device:heartbeat` | Device heartbeat |
| `sensor:alert` | Sensor alert |
| `alert:created` | Alert created |
| `notification:new` | Legacy notification event |
| `notification:created` | Notification created |
| `notification:read` | Notification read |
| `notifications:readAll` | All notifications read |
| `notification:deleted` | Notification deleted |
| `notifications:cleared` | Notifications cleared |
| `workorder:new` | Work order created |
| `workorder:updated` | Work order updated |
| `workorder:deleted` | Work order deleted |
| `enterprise:dashboard:refresh` | Enterprise dashboard refresh |
| `enterprise:fleet:update` | Fleet update |
| `enterprise:maintenance:update` | Maintenance status update |
| `ai:vision:event` | AI Vision event created |
| `ai:vision:event:update` | AI Vision event status changed |

## Production Verification

Use these checks after deployment:

```text
GET https://kavach-spgh.onrender.com/api/health
GET https://kavach-spgh.onrender.com/api/docs/openapi.json
POST https://kavach-spgh.onrender.com/api/auth/login
```

Then verify in the browser:

- Requests go to the configured HTTPS backend URL
- Socket.IO connects through WSS
- No mixed-content errors
- No CORS preflight failures
- Login, dashboard, machines, analytics, alerts, audit, profile, notifications, and logout work
