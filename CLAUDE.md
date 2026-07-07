# CLAUDE.md

## Project
- **KAVACH** — industrial decision-intelligence for a single plant.
- One-liner: turn real machine telemetry into trustworthy KPIs and close the loop by assigning the fix.
- User + problem: a plant/operations manager needs to see which machines are *actually* failing (not fake dashboards) and immediately turn that into an assigned, tracked work order.
- Status: rebuild in progress — scope reset from a 25-route, partly-faked app to a real, test-first core.

## Commands (run from repo root)
- dev: `npm run backend:dev` + `npm run frontend:dev` (two processes; backend also runs MQTT ingest + Socket.IO)
- test (full regression): `npm run test` → runs `backend:test` (node --test) and `frontend:test` (vitest run)
- run one test: backend `node --test backend/src/x.test.js` or `--test-name-pattern="name"`; frontend `npm --prefix frontend exec vitest run <path> -t "name"`
- typecheck: `npm run frontend:typecheck` (tsc --noEmit)
- lint/format: `npm run lint` (eslint backend + frontend, prettier --check)
- build: `npm run frontend:build`

## Tech stack (minimal; mostly already proven to build green)
- Next.js 16 (App Router, React 19, TS strict) — one framework for UI, routing, SSR.
- Express 5 — hosts the long-lived MQTT subscriber + Socket.IO server (Next can't) and the REST API.
- MongoDB + Mongoose — flexible store for machines / time-series readings / work orders; already indexed.
- mqtt.js — real device telemetry transport (the only live data source).
- Socket.IO — push live health/KPI/alert updates to the browser (authenticated handshake).
- jsonwebtoken + bcrypt — stateless auth, hashed passwords, pinned HS256.
- Tailwind CSS — utility styling, no extra design-system dependency.
- node:test (backend) + Vitest + Testing Library (frontend) — test-first runners.
- pdfkit — reliable PDF export (replaces the fragile hand-rolled byte writer).

## Architecture (2 processes)
Devices publish telemetry over MQTT → Express **ingest** validates + stores `Reading`s → **health** + **threshold/alert** evaluated → **KPI engine** aggregates OEE/MTBF/MTTR over a window → REST API serves the frontend and Socket.IO pushes live changes. The manager reads dashboards/reports and creates `WorkOrder`s; engineers resolve them. Mongo is the single store. All config from env; roles enforced in middleware; every query scoped to the caller.

## Project structure
- backend/src: `ingest/` (mqtt), `models/`, `services/` (kpi, health, alerts, workOrders, reports, auth), `controllers/`, `routes/`, `middleware/`, `socket/`, `config/`, `test/`
- frontend: `app/` (login, dashboard, machines, workorders, alerts, reports, admin), `components/`, `lib/` (api, auth, socket), `types/`, `test/`

## Core concepts / domain
- **Machine**: id, name, location, thresholds; derived `healthScore` + `status`.
- **Reading**: machineId, ts, metric→value; time-series, source ∈ {device, sim}.
- **KPI**: OEE = availability × performance × quality (each a fraction); MTBF, MTTR in real time units, computed over a window.
- **Alert**: machineId, metric, breachValue, severity, ts, acknowledged.
- **WorkOrder**: machineId, title, assigneeId, status Open→Assigned→In Progress→Resolved, priority, createdBy, linkedAlertId.
- **User**: name, email, passwordHash, role ∈ {Manager, Engineer, Viewer}, refreshTokenHash. Role→permissions is a **server-owned** map.

## Conventions
- Naming: camelCase fns/vars, PascalCase components + models, kebab-case route files, `*.test.*` beside code.
- Components: server components by default; `'use client'` only for hooks/state; data only via typed `lib/api` (no raw fetch, no hardcoded URLs).
- State: server data via the typed fetch layer + Socket.IO; only auth in context; no other global store.
- Errors: API returns `{ success, message }`; never leak stacks (NODE_ENV=production); UI shows loading/error and redirects to /login on unrecoverable 401.
- Hard rules: no secrets in git; NEVER accept `role`/`permissions`/`tenantId` from a request body; env-only URLs; **no fake numbers in the UI — every value traces to real data or is labeled "demo"**; escape user input before `RegExp`; scope every list query to the caller.

## Testing philosophy
Test-first: write the failing test that encodes the behavior, then implement. The full suite (backend node:test + frontend Vitest) is the regression gate — a part is "done" only when both suites are green. Never silently break an existing feature; if behavior must change, update its test on purpose, don't delete it.

## Workflow rules for Claude
1. Plan mode first; get the plan approved before editing.
2. Build exactly ONE part from build-spec.md at a time, in order; don't start the next until this part's DoD is met and the whole suite is green.
3. Write the part's "tests to write first" before the implementation.
4. One focused git commit per part.
5. Tick the Feature registry box, then I `/clear` before the next part.

## Feature registry
- [x] Part 1 — Foundation, Secrets & Auth/Roles ✅ 2026-07-08
- [x] Part 2 — Telemetry Ingest, Health & Alerts ✅ 2026-07-08
- [ ] Part 3 — KPI Engine (OEE/MTBF/MTTR)
- [ ] Part 4 — Work Orders & the Closed Loop
- [ ] Part 5 — Manager UI: Dashboards, Drill-down, Alerts, Reports & Live Updates
- [ ] Part 6 — Deployment Hardening & CI

## Known decisions
- Keep the two-process split (Express owns MQTT + Socket.IO; Next owns UI).
- Core = KPI oversight + closing the loop into work orders. Predictive AI / copilot chat are OUT of v1.
- Single org / single plant for v1; multi-tenant isolation + billing are the deferred north star.
- Real MQTT telemetry is the only live source; the simulator is dev-only and always labeled.
- Roles are fixed (Manager/Engineer/Viewer), admin-assigned, never self-selected at signup.

## Next
Start **Part 3 — KPI Engine (OEE/MTBF/MTTR)** (see build-spec.md). Enter plan mode first. Build pure, unit-tested plant + per-machine OEE/MTBF/MTTR over a window from the Part 2 `Reading`/`Alert` (+ Part 4 `WorkOrder`) data, with correct units and an auth-required endpoint scoped to the caller.

### Part 1 notes (done 2026-07-08)
- Auth spine: register (always Viewer; ignores role/permissions/tenant), login (access+refresh), refresh, logout. JWT pinned to HS256 everywhere; access token carries only `{id, name, email, role}` (permissions derived server-side from `security/rbac.js`). Roles = Manager/Engineer/Viewer (user model enum + `USER_MANAGEMENT_ROLES`). Admin create-user is `users:manage`-guarded; Viewer is 403.
- Secrets: `backend/.env` untracked + gitignored; JWT_SECRET/JWT_REFRESH_SECRET rotated; `getRefreshSecret()` placeholder fallback removed. **Deferred (per owner): purge `backend/.env` from git history** — the rotation already invalidates the old secret.
- Scope reset: `src/app.js` factory mounts only `/api/auth` + `/api/users`; slim `index.js` (no MQTT/Socket.IO/sensor/backup in Part 1 — return in Parts 2–5). Deleted 16 out-of-scope routes + 17 controllers + 20 services + 12 legacy feature tests. Frontend: deleted 13 out-of-scope page trees + orphaned components; trimmed `lib/navigation.ts`.
- Tests: backend `node --test` = 13 green (`src/test/auth.test.js` covers the 6 DoD tests; kept `test/rbac.test.js`, `test/exportUtils.test.js`). Frontend typecheck clean.
- **Dormant legacy pending rebuild:** `machineController`/`workOrderController` still import `middleware/tenantMiddleware.js`; `workOrderService.js` still imports the deleted `predictionService.js` (latent — these files are unmounted/unloaded and get rebuilt in Parts 2/4). Frontend dashboard `app/page.tsx` still renders AI/3D widgets (Part 5 UI redesign). Frontend Vitest harness deferred to Part 5 (no Part 1 frontend tests).

### Part 2 notes (done 2026-07-08)
- **Clean domain models (rebuild canon, replacing legacy bloat):** rewrote `models/machine.js` to the spec shape `{ machineId, name, location, linkedDeviceId, thresholds[], healthScore, status ∈ Running/Warning/Critical/Offline, lastReadingAt, lastReadingSource }` — dropped the ~40 legacy AI/enterprise fields. New `models/reading.js` = tall time-series (one doc per machine/metric/ts, `source ∈ {device, sim}`). New `models/alert.js` = `{ machineId, metric, breachValue, threshold, severity ∈ Warning/Critical, status ∈ open/acknowledged/resolved, ts, acknowledged… }`.
- **Ingest (transport-agnostic, fail-closed):** `services/ingest.js` `verifyDeviceSecret()` fails CLOSED — unset `DEVICE_SECRET` rejects everything, no fail-open (fixed the latent fail-open in `middleware/deviceAuthMiddleware.js`, now shares the same verifier; timing-safe compare). `ingestTelemetry(payload,{source,deviceSecret,trusted})` parses/validates (metric registry `METRIC_UNITS`), fans a packet into per-metric `Reading`s, recomputes health from **live** readings, updates the machine, syncs alerts. `iot/mqttIngest.js` `handleMqttMessage(topic,msg)` is broker-free testable; `attachMqttIngest(client)` wires a real broker.
- **Health engine (pure/deterministic):** `services/health.js` `computeHealth(machine, readings)` → `{ healthScore, status, breaches }`. Latest-per-metric vs thresholds; Critical > Warning; penalty Warning −20 / Critical −50, clamp 0–100. Metrics with no configured threshold are ignored (no invented health).
- **Alerts (dedupe/clear/ack):** `services/alerts.js` `syncAlerts()` keeps **one active alert per (machineId, metric)** — breach with no active alert opens one; repeat breach updates in place (no dupes, severity can escalate); metric returning to normal → `resolved` (cleared); a later breach opens a fresh alert. `acknowledgeAlert(id,userId)` → status `acknowledged` (still active). Manager-facing alert REST/UI is Part 5.
- **Simulator opt-in + live gating:** `iot/telemetrySimulator.js` runs only when `ENABLE_SENSOR_SIMULATION` is on; every sim packet is flagged `source:"sim"`. `liveSources()` excludes `sim` when the flag is off, so sim readings are stored-but-not-counted (health/status/alerts untouched). `index.js` wires MQTT (`IOT_ENABLED`) + simulator behind env guards, both stopped on shutdown; tests import `app.js` (never `index.js`) so nothing background starts in tests. `seed.js` rewritten to 4 clean machines with thresholds.
- **Tests:** `src/test/ingest.test.js` = 18 tests (health mapping/score, fail-closed auth + MQTT reject, reading persisted/fan-out/404, alert raise/dedupe/clear/ack, sim tagged + not-counted-when-off + counted-when-on). Full backend suite **31 green**; frontend typecheck clean (npm shim `Permission denied`/`bad interpreter` on this synced `~/kavach` tree is an FS quirk — `node node_modules/typescript/bin/tsc` exits 0).
- **Decision — MQTT/service is the ingest surface, no public REST ingest route:** honors "MQTT is the only live source"; the DoD (valid secret persists / bad secret rejected) is covered via the service + MQTT handler (broker-free). The fail-closed `deviceAuthMiddleware` is fixed and ready for any future device HTTP path but is not mounted.
- **Still-dormant legacy (unchanged, unloaded):** old `iot/telemetryProcessor.js` + `iot/mqttSubscriber.js` + `iot/connectionManager.js` still import deleted services — left in place (never loaded) rather than cascade-delete; superseded by the clean `mqttIngest`/`telemetrySimulator`. Legacy `models/telemetry.js`/`sensorHistory.js` unused. Reusable: `iot/mqttClient.js` (clean).
