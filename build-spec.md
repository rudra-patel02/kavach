# build-spec.md — KAVACH

## App
KAVACH — a single-plant industrial decision-intelligence app that turns real MQTT machine telemetry into trustworthy KPIs (OEE/MTBF/MTTR) and lets a manager close the loop by assigning tracked work orders to engineers.

## User + problem
Primary user: a plant/operations manager. Problem: current tooling shows dashboards they can't trust (fake/placeholder numbers) and never connects an insight to an action. KAVACH shows only real, telemetry-derived KPIs and makes "spot the failing machine → assign the fix → watch it resolve" one flow. Secondary users: engineers (receive/update work orders) and viewers/execs (read-only).

## Core screens/pages
1. Login
2. Dashboard (KPI overview)
3. Machine detail / drill-down
4. Work orders (list + detail)
5. Alerts (alert center)
6. Reports (export)
7. Admin — users & roles (minimal)

## Key features per screen
- **Login**: email/password; on success stores tokens and redirects to Dashboard; wrong creds show an error; no role selection anywhere.
- **Dashboard**: real plant OEE/MTBF/MTTR + a per-machine health list, all computed from readings; live-updating; each KPI clickable to drill down; time-window selector.
- **Machine detail**: real reading history + health trend for one machine; the metrics/thresholds behind its status; a "Create work order" action for this machine.
- **Work orders**: list filtered by status/assignee; manager creates (machine, title, priority, assignee); engineer advances the lifecycle; who/when is recorded.
- **Alerts**: chronological threshold breaches with severity; acknowledge; jump to the machine or raise a work order.
- **Reports**: pick type + window → export the real KPI data as PDF/CSV; nothing fabricated.
- **Admin users**: create user, assign one of the three roles, deactivate; role is set here only.

## Data/state the app tracks
- Users (name, email, passwordHash, role, active, refreshTokenHash)
- Machines (id, name, location, thresholds; derived healthScore + status)
- Readings (machineId, ts, metric, value, source) — time-series
- Alerts (machineId, metric, breachValue, severity, ts, acknowledged)
- WorkOrders (machineId, title, description, priority, assigneeId, status, createdBy, timestamps, linkedAlertId)
- Derived KPI results per window — recomputed, not stored as source of truth

## Key user flows
1. Manager lands → logs in → Dashboard shows real OEE/MTBF/MTTR → notices OEE dropped → clicks it → sees the machine dragging it down → opens that machine → "Create work order" → assigns an engineer → work order = Assigned.
2. Device publishes telemetry → ingest stores reading → health recomputed → threshold breached → Alert created → appears live on Alerts + Dashboard → manager acknowledges and assigns a work order.
3. Engineer logs in → sees work orders assigned to them → moves one Open→In Progress→Resolved → manager sees the status update live → the machine's KPI recovers as new readings arrive.
4. Manager opens Reports → "Plant health, last 30 days" → exports PDF → shares with stakeholders; the numbers match the dashboard exactly.

## Tech stack
Next.js 16 (App Router, TS) frontend; Express 5 API + MQTT ingest + Socket.IO; MongoDB/Mongoose; jsonwebtoken + bcrypt; Tailwind; node:test + Vitest; pdfkit. Two processes, one Mongo, nginx proxies `/api` and the socket in prod.

## OUT OF SCOPE for v1 (explicit cuts)
- Multi-tenant / multi-company isolation, org invites, billing, subscriptions.
- Multi-plant rollups and cross-plant analytics.
- Predictive AI (RUL, failure probability, root-cause AI) and the AI copilot chat.
- Safety page, digital-twin 3D, audit-log UI, enterprise/system admin consoles.
- SSO / external identity providers.
- Any simulated data presented as live (the simulator is dev-only and labeled).
- Self-service role selection of any kind.

## PART BREAKDOWN

### Part 1 — Foundation, Secrets & Auth/Roles
- **Covers**: reset scope (delete out-of-scope routes/pages), load all secrets from env, and build the auth spine — login/refresh/logout with hashed passwords, three server-owned roles, and role middleware.
- **Depends on**: none.
- **Definition of done**: repo builds + full suite green with only in-scope routes mounted; `backend/.env` untracked and the secret rotated; self-signup (and admin create-user) can never set role/permissions/tenant from the body (self-signup is always Viewer); JWT verified with pinned HS256; role middleware allows/denies correctly; NODE_ENV=production hides stack traces.
- **Tests to write first**: self-register ignores a client-supplied `role` and yields Viewer; admin create-user assigns a role; login returns tokens for valid creds and 401 for invalid; role middleware permits a Manager-only route for a Manager and 403s a Viewer; a tampered / alg-swapped JWT is rejected; production error responses contain no stack.
- **Manual checklist**: `.env` purged from git history and secret rotated; no out-of-scope page reachable by URL; secrets live only in env/secret store.

### Part 2 — Telemetry Ingest, Health & Alerts
- **Covers**: authenticate MQTT devices (fail closed), validate + store readings as time-series, compute per-machine health from readings vs thresholds, and raise an Alert on breach.
- **Depends on**: Part 1.
- **Definition of done**: a device with a valid secret can publish a reading that is persisted; a device with a missing/invalid secret is rejected (no fail-open); health recomputes from the latest readings; crossing a threshold creates exactly one Alert (no duplicate spam) and acknowledges/clears correctly; the dev simulator is opt-in via env and every simulated reading is flagged `source=sim`.
- **Tests to write first**: ingest rejects an unauthenticated device; a valid reading is stored with correct machine/metric/ts; health maps known readings to the expected status; a threshold breach creates an Alert; a second breach within the window does not duplicate it; simulated readings are tagged and never counted as live when the flag is off.
- **Manual checklist**: point a real/mock MQTT publisher at the broker and watch a reading land; confirm the broker requires credentials; confirm the simulator is clearly labeled wherever shown.

### Part 3 — KPI Engine (OEE / MTBF / MTTR)
- **Covers**: pure, unit-tested functions that compute plant + per-machine OEE, MTBF, and MTTR over a time window from readings/alerts/work orders, with correct units.
- **Depends on**: Part 2.
- **Definition of done**: on a fixed dataset, OEE = availability × performance × quality (each a proper fraction — no subtracting hours from percentages), MTBF/MTTR use real elapsed/repair time and don't double-count a failure; results are deterministic and window-scoped; an auth-required endpoint returns them scoped to the caller.
- **Tests to write first**: OEE on a known dataset equals the hand-computed value; availability never exceeds 100% and never mixes units; MTBF counts each failure once (a machine that is Critical AND has a Critical alert is one failure); MTTR averages actual repair durations; an empty window returns zeros, not NaN; the endpoint requires auth.
- **Manual checklist**: spot-check one machine's KPIs by hand against its raw readings; confirm dashboard and report show identical numbers for the same window.

### Part 4 — Work Orders & the Closed Loop
- **Covers**: create/assign/update work orders through their lifecycle, safely (whitelisted fields, scoped queries), linked to the machine/alert that triggered them.
- **Depends on**: Parts 1–3.
- **Definition of done**: a Manager can create + assign a work order for a machine; an Engineer can advance only their own work orders Open→Assigned→In Progress→Resolved; a Viewer cannot mutate; updates never accept owner/tenant fields from the body (no mass assignment); at most one active work order per machine (enforced); every list is scoped to the caller.
- **Tests to write first**: manager create → status Assigned + linked machine/alert; engineer valid transition succeeds, invalid transition rejected; viewer create/update 403; a body attempting to swap `createdBy`/`machineId` on update is ignored; a duplicate active work order for a machine is rejected; list returns only permitted records.
- **Manual checklist**: walk one alert → work order → resolved end-to-end via the API; confirm the machine link and assignee are correct.

### Part 5 — Manager UI: Dashboards, Drill-down, Alerts, Reports & Live Updates
- **Covers**: the web app on top of Parts 1–4 — auth-guarded pages, real KPI dashboard with drill-down, alert center, work-order screens, report export, and live updates via an authenticated Socket.IO handshake. No fake data anywhere.
- **Depends on**: Parts 1–4.
- **Definition of done**: every protected page is behind the auth guard and redirects to /login on unrecoverable 401; all data flows through the typed `lib/api` (no hardcoded URLs, token attached); Socket.IO connects only with a valid token and pushes live health/KPI/alert/work-order changes; dashboard KPIs equal the API's; drill-down from a KPI reaches the machine and a "create work order" action; report exports match the dashboard; no component renders a hardcoded metric (grep clean); misspelled component files renamed.
- **Tests to write first**: an unauthenticated visit to a protected page redirects to /login; the api client attaches the bearer token and, on 401, refreshes then redirects; the dashboard renders KPIs from a mocked API and updates on a socket event; "create work order" from a machine posts via the api layer (not raw fetch); role-gated UI hides mutation controls from a Viewer.
- **Manual checklist**: click the full flow in a browser; confirm a live update appears without refresh; confirm the socket rejects a tokenless connection; visually confirm no widget shows invented numbers.

### Part 6 — Deployment Hardening & CI
- **Covers**: make the documented deploy actually work and be safe — Docker/compose fixes, Mongo auth, closed ports, non-root containers, correct CORS/socket topology behind nginx, real secret injection, and a CI pipeline that audits and blocks regressions.
- **Depends on**: Parts 1–5.
- **Definition of done**: `docker compose up` brings the app up reachable only through nginx (`/api` + socket proxied), with Mongo requiring credentials and no stray published ports; containers run as a non-root user and prod images ship no dev deps; secrets come from env/secret store (no placeholder that boots in production); CI runs install→typecheck→lint→test→build plus `npm audit`, failing on High/Critical; README/DEPLOYMENT match reality (no dead file references).
- **Tests to write first**: a config test asserts the app refuses to boot in production with a placeholder/short secret or wildcard CORS; a smoke test hits the health endpoint through the nginx service; the CI config is asserted to include the audit + full suite steps.
- **Manual checklist**: a fresh `docker compose up` on a clean machine works end-to-end; direct access to Mongo/backend is blocked; a rotated secret is read from env; no secret is present in the image or git.
