# KAVACH

A single-plant industrial decision-intelligence app: it turns real MQTT machine
telemetry into trustworthy KPIs (OEE / MTBF / MTTR) and lets a manager close the
loop by assigning tracked work orders to engineers. **No fabricated numbers** —
every value on screen traces to real data or is labelled as demo.

## What it does

- Ingests device telemetry over MQTT (fail-closed device auth), stores it as
  time-series `Reading`s, recomputes each machine's health/status, and raises
  deduped `Alert`s on threshold breaches.
- Computes plant + per-machine **OEE = availability × performance × quality**,
  **MTBF** and **MTTR** over a window, from readings/alerts/work-orders.
- Lets a Manager spot a failing machine → open its detail → create + assign a
  work order; an Engineer advances it `Open → Assigned → In Progress → Resolved`;
  the resolved repair time feeds MTTR. Live updates push over an authenticated
  Socket.IO channel.

## Roles (server-owned, never self-selected)

- **Manager** — full oversight: create/assign work orders, acknowledge alerts,
  manage users.
- **Engineer** — advances the work orders assigned to them.
- **Viewer** — read-only dashboards, alerts and reports.

Self-registration always yields a Viewer; roles are assigned only by a Manager
in the admin screen.

## Tech stack

- **Frontend:** Next.js 16 (App Router, React 19, TypeScript), Tailwind CSS.
- **Backend:** Express 5 (REST API + long-lived MQTT subscriber + Socket.IO),
  MongoDB/Mongoose, jsonwebtoken + bcrypt (HS256-pinned).
- **Tests:** backend `node:test`, frontend Vitest + Testing Library.
- **Deploy:** Docker Compose behind nginx (only nginx is published).

## Repo layout

- `backend/src`
  - `models/` — `machine`, `reading`, `alert`, `workOrder`, `user`
  - `services/` — `ingest`, `health`, `alerts`, `kpi`, `kpiQuery`, `workOrders`
  - `controllers/` + `routes/` — `auth`, `users`, `kpi`, `workOrder`, `report`,
    `machine`, `alert`
  - `socket/` — authenticated Socket.IO server + event names
  - `middleware/`, `config/`, `iot/`, `security/`, `test/`
- `frontend`
  - `app/` — `login`, `/` (dashboard), `machines/[id]`, `workorders`, `alerts`,
    `reports`, `admin`
  - `components/` — `AppShell`, `AuthGuard`, and the page view components
  - `lib/` — `api` (typed fetch), `data` (the one data layer), `socket`, `auth`
  - `types/`, `test/`
- `nginx/`, `deployment/`, `docker-compose.yml`, `.env.example`

## REST API (in scope)

- `POST /api/auth/login` · `POST /api/auth/refresh` · `POST /api/auth/logout`
- `GET/POST/PATCH/DELETE /api/users` — admin user management (Manager)
- `GET /api/kpis` — plant + per-machine OEE/MTBF/MTTR over a window
- `GET /api/machines` · `GET /api/machines/:id` (with recent readings)
- `GET /api/workorders` · `GET /api/workorders/:id` · `POST /api/workorders`
  (Manager) · `PATCH /api/workorders/:id` (Manager/Engineer)
- `GET /api/alerts` · `PATCH /api/alerts/:id/acknowledge` (Manager)
- `GET /api/reports/kpis?format=csv|json` — export matching the dashboard
- `GET /api/health` — liveness

Telemetry ingest is **not** a public REST route — it arrives over MQTT (the only
live source). Socket.IO requires a valid JWT in the handshake.

## Develop

```bash
# backend (needs a local MongoDB + backend/.env, see backend/.env.example)
npm run backend:dev
# frontend
npm run frontend:dev
```

## Test / lint / typecheck / build

```bash
npm run test              # backend node:test + frontend Vitest
npm run frontend:typecheck
npm run lint              # frontend eslint
npm run frontend:build
```

## Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) — `docker compose up` behind nginx.
