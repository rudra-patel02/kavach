# KAVACH Architecture

KAVACH uses the existing split architecture: a Next.js frontend, an Express backend, MongoDB persistence, Socket.IO realtime transport, and optional industrial edge integrations. Recent enterprise features were added inside the same frontend routes and backend services; no new architectural tier was introduced.

## System Context

```text
Operators, engineers, plant managers, executives
  |
  v
Next.js App Router frontend
  |
  | same-origin /api proxy or configured HTTPS API base
  | Socket.IO path /socket.io
  v
Express REST API + Socket.IO gateway
  |
  | Mongoose models and service layer
  v
MongoDB Atlas

Edge devices / ESP32 -> IoT REST endpoints -> telemetry processor -> machines, notifications, work orders
MQTT broker -> MQTT subscriber -> telemetry processor
AI Vision edge -> smart-factory vision endpoints -> camera/event collections + notifications
```

## Frontend Architecture

The frontend lives in `frontend/` and uses Next.js App Router.

Key areas:

- `frontend/app`: route entry points for dashboard, AI, predictive, enterprise, IoT, reports, settings, auth, and error/loading pages
- `frontend/components`: dashboard widgets, predictive components, layout, copilot, digital twin, enterprise workspace, charts
- `frontend/hooks`: shared live telemetry hooks such as `useEnterpriseTelemetry` and `useMachineFeed`
- `frontend/lib`: API client, auth helpers, Socket.IO client, feature-specific API modules
- `frontend/types`: TypeScript contracts for API payloads and UI data

Network behavior:

- Browser API calls normally use same-origin `/api`.
- `frontend/app/api/[...path]/route.ts` proxies API requests to `API_URL`.
- Socket.IO polling is proxied through `frontend/app/socket.io/route.ts`.
- `NEXT_PUBLIC_API_URL` may be blank to avoid browser CORS.
- `NEXT_PUBLIC_SOCKET_URL` points to the backend origin for socket metadata and production configuration.

Performance and UX:

- Heavy dashboard sections are dynamically loaded.
- App-level `loading.tsx`, `error.tsx`, `global-error.tsx`, and `not-found.tsx` provide loading, 500, and 404 states.
- Data-heavy modules include loading, error, empty, and retry states.

## Backend Architecture

The backend lives in `backend/` and uses Express 5.

Key areas:

- `backend/src/index.js`: app bootstrap, middleware registration, routes, Socket.IO server startup
- `backend/src/routes`: REST route definitions
- `backend/src/controllers`: request handlers
- `backend/src/services`: business logic, AI calculations, reports, enterprise ops, telemetry, notifications
- `backend/src/models`: Mongoose schemas
- `backend/src/middleware`: auth, RBAC, tenant scope, validation, security, error handling, performance
- `backend/src/socket`: Socket.IO server and machine gateway
- `backend/src/iot`: MQTT, heartbeat, device registry, telemetry processing
- `backend/test`: Node test suite

Backend startup requires MongoDB. If MongoDB cannot connect, the HTTP server is not started.

## Data Flow

1. A user logs in through `/api/auth/login`.
2. The frontend stores the access token and refresh token.
3. Authenticated requests include `Authorization: Bearer <token>`.
4. Controllers call services and Mongoose models.
5. Writes to machines, telemetry, notifications, and work orders trigger Socket.IO updates.
6. Frontend hooks consume REST snapshots and socket events to keep pages live.

## AI and Predictive Flow

Current AI and prediction features use deterministic services built from live project data:

- `predictionService.js` computes failure probability, risk level, RUL, confidence, root cause analysis, business impact, and maintenance priority.
- `smartFactoryService.js` builds what-if simulation results without mutating machine state.
- `aiCopilotService.js` answers plant-context questions using project data.
- AI modules present overview, fleet health, root cause, executive insights, failure forecast, machine intelligence, and maintenance planner outputs.

## IoT and Smart Factory Flow

- Devices register and send telemetry through `/api/iot` routes.
- Device heartbeat and stale-device monitoring update connection state.
- MQTT support is available when `IOT_ENABLED=true`.
- Smart Factory routes expose protocol health, digital twin state, AI Vision camera dashboard, event ingestion, and timeline.
- AI Vision events can create `safety_warning` notifications and Socket.IO events.

## Realtime Events

Socket.IO uses path `/socket.io` and supports plant and machine rooms. Important events include:

- `machineUpdate`, `machines:update`, `machine:update`
- `predictive:overview`, `prediction:update`
- `telemetry:update`, `sensor-update`, `sensor:alert`
- `notification:new`, `notification:created`, `alert:created`
- `workorder:new`, `workorder:updated`, `workorder:deleted`
- `enterprise:dashboard:refresh`, `enterprise:fleet:update`, `enterprise:maintenance:update`
- `ai:intelligence:update`, `ai:anomaly`, `ai:forecast:update`, `ai:maintenance-plan:update`

## Security

- JWT access tokens and refresh tokens
- bcrypt password hashing
- RBAC role middleware and permission helpers
- Tenant and plant scoping middleware
- Security headers, cookie hardening, rate limiting, request sanitization
- CORS shared by Express and Socket.IO
- Device authentication for IoT writes through `DEVICE_SECRET`

## Deployment Topology

Recommended production topology:

- Frontend on Render or Vercel
- Backend on Render or Railway
- MongoDB Atlas
- HTTPS-only public origins
- Exact frontend origin configured in backend `CORS_ORIGIN`
- Backend URL configured as frontend `API_URL`

## Compatibility Notes

- The `/saftey` route intentionally redirects to `/safety`.
- Existing REST paths, auth behavior, Socket.IO event names, and MongoDB collections remain backward compatible.
- Recent enterprise features are UI/service additions under existing routes and APIs.
