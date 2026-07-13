# KAVACH

KAVACH is a production-ready industrial operations platform for machine monitoring, predictive maintenance, enterprise plant management, AI-assisted operations, alerts, audit logs, reports, work orders, and live Socket.IO telemetry.

The repository contains a Next.js frontend and an Express/MongoDB backend. The production deployment is configured for Render, MongoDB Atlas, HTTPS-only frontend API calls, Express CORS, and Socket.IO websocket handshakes.

## Production URLs

Update this section if the Render service names change.

| Service | URL |
| --- | --- |
| Frontend | `https://kavach-1-7749.onrender.com` |
| Backend API | `https://kavach-spgh.onrender.com` |
| API health | `https://kavach-spgh.onrender.com/api/health` |
| API docs | `https://kavach-spgh.onrender.com/api/docs` |
| OpenAPI JSON | `https://kavach-spgh.onrender.com/api/docs/openapi.json` |
| Socket.IO | `wss://kavach-spgh.onrender.com/socket.io` |

## Architecture

```text
Browser
  |
  | HTTPS / WSS
  v
Next.js frontend
  |
  | NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SOCKET_URL
  v
Express API + Socket.IO
  |
  | MONGO_URI
  v
MongoDB Atlas

Optional: MQTT broker -> backend IoT ingestion -> Socket.IO -> live UI
```

## Repository Layout

```text
.
|-- backend/              Express API, Socket.IO, MongoDB models, services
|-- frontend/             Next.js app, dashboard UI, API helpers
|-- deployment/           Deployment support files
|-- nginx/                Optional reverse proxy assets
|-- docker-compose.yml    Local/container deployment reference
|-- render.yaml           Render backend service blueprint
|-- .env.example          Full environment variable reference
|-- .env.production.example
|-- README.md             Product and operations overview
|-- INSTALL.md            Local installation guide
|-- DEPLOYMENT.md         Production deployment guide
|-- API.md                REST and Socket.IO reference
```

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Visualization | Three.js, React Three Fiber, Drei, Recharts |
| Backend | Node.js 22, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | JWT access tokens, refresh tokens, bcrypt password hashing |
| Realtime | Socket.IO websocket and polling fallback |
| IoT | Optional MQTT integration and device telemetry ingestion |
| Deployment | Render, Docker Compose reference |

## Main Capabilities

- Dashboard and executive operations views
- Machine registry, machine detail, digital twin views, and live status
- Enterprise organization, plant, region, area, asset, engineer, and onboarding flows
- Predictive maintenance and work order management
- AI overview, fleet health, root cause, forecasts, and copilot chat
- Alerts, notifications, preferences, and archive/read workflows
- Audit logs and exportable reports
- System health, backup export/configuration, and operational diagnostics
- Socket.IO live updates for machines, telemetry, alerts, work orders, and enterprise refresh events

## Required Runtime

- Node.js `22.x`
- npm `10+`
- MongoDB Atlas or compatible MongoDB server
- HTTPS hosting for production frontend and backend

## Environment Files

Use `.env.example` as the full reference. Do not commit real secrets.

Frontend production must include:

```env
NEXT_PUBLIC_API_URL=https://kavach-spgh.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
```

Backend production must include:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
CORS_ORIGIN=https://kavach-1-7749.onrender.com
CORS_CREDENTIALS=true
IOT_ENABLED=false
ENABLE_SENSOR_SIMULATION=false
```

## Common Commands

Run commands from the repository root unless noted.

```bash
npm run backend:dev
npm run backend:start
npm run backend:seed
npm run backend:test
npm run frontend:dev
npm run frontend:lint
npm run frontend:typecheck
npm run frontend:build
npm run frontend:start
```

## Authentication

The backend stores passwords as bcrypt hashes. The seeded production admin account is:

```text
Email: admin@kavach.com
Password: admin123
```

Rotate this password immediately after production access is confirmed.

## Production Rules

- Use only HTTPS backend URLs in frontend environment variables.
- Use only WSS/HTTPS Socket.IO connections in production.
- Configure backend CORS for the exact frontend origin.
- Never expose `MONGO_URI`, JWT secrets, device secrets, or repair keys in frontend variables.
- Do not run one-time repair endpoints in production after verification.
- Confirm MongoDB Atlas network access allows the Render backend outbound IP range or appropriate access rule.

## Documentation

- Local setup: `INSTALL.md`
- Production deployment: `DEPLOYMENT.md`
- API and realtime contract: `API.md`
- Live Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs/openapi.json`
