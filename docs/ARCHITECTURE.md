# KAVACH v4.0 Architecture

KAVACH v4.0 keeps the existing split architecture: Next.js frontend, Express API, MongoDB/Mongoose persistence, Socket.IO realtime updates, and optional industrial edge integrations.

## Runtime View

```text
Browser / PWA
  | HTTPS, WSS
  v
Next.js App Router frontend
  | /api rewrite or NEXT_PUBLIC_API_URL
  v
Express API + Socket.IO
  | Mongoose
  v
MongoDB Atlas

ESP32 / edge gateway -> REST or MQTT ingestion -> telemetry processor -> machines + telemetry + Socket.IO
AI Vision edge -> smart-factory vision API -> AI vision events + notifications + Socket.IO
```

## Frontend Modules

- Dashboard: executive KPIs, charts, alerts, digital twin card.
- Digital Twin: Three.js Smart Factory scene with live machine status, sensor overlays, alarm markers, selected-machine details, and production flow animation.
- Smart Factory: protocol readiness, camera dashboard, AI Vision timeline, QR lookup, and vision event creation.
- Predictive: RUL, failure probability, machine ranking, recommendations, and what-if simulation.
- Enterprise: organizations, plants, assets, work orders, engineers, alerts, reports, audit, and settings.
- PWA: manifest, service worker shell cache, and push subscription controls.

## Backend Modules

- Auth and RBAC: JWT access/refresh tokens, bcrypt passwords, role middleware.
- Tenant scope: tenant, organization, plant context added by middleware.
- Machines and telemetry: machine registry, ESP32 REST sensor path, MQTT topics, device registry, heartbeat logs.
- AI intelligence: anomaly, RUL, forecast, root cause, recommendation, planner, copilot.
- Smart Factory: protocol health, digital twin state, AI Vision cameras, AI Vision events, event timeline, safety alert mapping.
- Notifications: alert center, preferences, read/archive/delete, push subscription storage.
- Reports: PDF/CSV/Excel exports, automated executive report schedules, delivery logs.

## Compatibility Rules

- Existing routes remain unchanged.
- ESP32 `/api/iot/sensor` and device-auth ingestion remain unchanged.
- Existing `Notification` records are reused for AI Vision alerts with `type: safety_warning`.
- Existing `Machine` fields remain the source of live twin state.
- New v4 features are additive under `/api/smart-factory`, `/api/predictive/simulate`, report automation, and push subscription routes.

## Data Collections Added For v4

- `aivisioncameras`
- `aivisionevents`
- `pushsubscriptions`
- `reportdeliverylogs`

No destructive migration is required.
