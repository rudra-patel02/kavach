# KAVACH

KAVACH is an industrial operations and decision-intelligence platform for live machine monitoring, predictive maintenance, AI-assisted plant operations, enterprise administration, IoT telemetry, Smart Factory digital twin views, reports, audit trails, and Socket.IO realtime updates.

The current implementation is a split application:

- Frontend: Next.js 16, React 19, TypeScript, App Router
- Backend: Node.js 22, Express 5, Socket.IO
- Database: MongoDB Atlas through Mongoose
- Realtime: Socket.IO polling/websocket transport
- AI/analytics: deterministic plant intelligence services with optional external AI configuration
- IoT: REST device telemetry, device heartbeat, MQTT readiness, protocol integration status

## Current Deployment

| Service | URL |
| --- | --- |
| Healthy frontend | `https://kavach-frontend-4s8e.onrender.com` |
| Primary frontend alias | `https://kavach-frontend.onrender.com` |
| Backend API | `https://kavach-spgh.onrender.com` |
| Health check | `https://kavach-spgh.onrender.com/api/health` |
| Socket.IO | `https://kavach-spgh.onrender.com/socket.io` |

Recent QA found the backend and `kavach-frontend-4s8e` deployment healthy. The primary frontend alias returned `503` during live checks and should be reviewed in Render before it is treated as the production entry point.

## Product Modules

- Dashboard: plant command view, KPIs, AI command center, live sensors, charts, alerts, digital twin preview
- Executive dashboard: KPI command center, AI PDF reports, department performance, top-risk machines, digital war room
- Enterprise operations: organizations, plants, fleet, engineers, notifications, work orders, reports, settings, audit
- Machines: machine list, machine creation, machine detail, AI root cause analysis, maintenance timeline
- Predictive maintenance: risk KPIs, RUL, ranking, maintenance calendar, AI recommendations, scenario simulator, incident investigation, efficiency optimizer
- Digital Twin and Plant: 3D factory scene, live machine state, playback controls, plant context
- IoT: device overview, device list, telemetry history, heartbeat and command paths
- Smart Factory: protocol readiness, digital twin state, AI Vision cameras, QR lookup, vision event timeline
- AI modules: overview, root cause, fleet health, executive insights, failure forecast, machine intelligence, maintenance planner
- Copilot: plant-context chat and report generation using current project data
- Analytics, reports, alerts, audit, users, settings, system health, backup controls

## Repository Layout

```text
.
|-- backend/                Express API, Socket.IO, Mongoose models, services, tests
|-- frontend/               Next.js app, layouts, pages, UI components, API clients
|-- docs/                   Architecture, database, user, developer, release docs
|-- deployment/             Deployment support assets
|-- nginx/                  Optional reverse proxy configuration
|-- scripts/                Local helper scripts
|-- API.md                  REST and Socket.IO reference
|-- DEPLOYMENT.md           Production deployment guide
|-- CHANGELOG.md            Release history
|-- INSTALL.md              Local installation guide
|-- README.md               Project overview
```

## Runtime Architecture

```text
Browser / PWA
  |
  | HTTPS, same-origin /api proxy, Socket.IO polling/WSS
  v
Next.js frontend
  |
  | API_URL server-side proxy or NEXT_PUBLIC_* direct base URLs
  v
Express API + Socket.IO
  |
  | Mongoose
  v
MongoDB Atlas

ESP32 / edge devices -> /api/iot telemetry and heartbeat -> machine state -> Socket.IO -> dashboard
AI Vision edge events -> /api/smart-factory/vision/events -> notifications + digital twin timeline
```

## Environment Summary

Use `.env.example`, `backend/.env.example`, and `frontend/.env.example` as the source of truth. Do not commit real secrets.

Frontend:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
API_URL=https://kavach-spgh.onrender.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Backend:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-refresh-secret>
CORS_ORIGIN=https://kavach-frontend-4s8e.onrender.com
CORS_CREDENTIALS=true
PUBLIC_API_BASE_URL=https://kavach-spgh.onrender.com
DEVICE_SECRET=<device-secret>
IOT_ENABLED=false
ENABLE_SENSOR_SIMULATION=false
```

## Common Commands

Run from the repository root.

```bash
npm run backend:dev
npm run backend:start
npm run backend:test
npm run frontend:dev
npm run frontend:lint
npm run frontend:typecheck
npm run frontend:build
npm run frontend:start
npm run verify
npm run verify:production
```

`npm run verify` runs frontend lint, frontend typecheck, frontend production build, and backend tests. `npm run verify:production` also runs frontend and backend production dependency audits.

## Authentication

Authentication uses bcrypt password hashing, JWT access tokens, refresh tokens, secure auth middleware, RBAC role checks, and audit logging. Source-level seeded admin defaults are:

```text
Email: admin@kavach.com
Password: admin123
```

Rotate seeded credentials immediately for real production use.

## Documentation

- API reference: `API.md`
- Architecture: `docs/ARCHITECTURE.md`
- Database schema: `docs/DATABASE_SCHEMA.md`
- Deployment guide: `DEPLOYMENT.md`
- User manual: `docs/USER_MANUAL.md`
- Developer guide: `docs/DEVELOPER_GUIDE.md`
- Changelog: `CHANGELOG.md`
- Release report: `docs/RELEASE_REPORT_v4.0.md`
