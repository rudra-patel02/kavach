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
- [x] Part 3 — KPI Engine (OEE/MTBF/MTTR) ✅ 2026-07-08
- [x] Part 4 — Work Orders & the Closed Loop ✅ 2026-07-09
- [ ] Part 5 — Manager UI: Dashboards, Drill-down, Alerts, Reports & Live Updates
- [ ] Part 6 — Deployment Hardening & CI

## Known decisions
- Keep the two-process split (Express owns MQTT + Socket.IO; Next owns UI).
- Core = KPI oversight + closing the loop into work orders. Predictive AI / copilot chat are OUT of v1.
- Single org / single plant for v1; multi-tenant isolation + billing are the deferred north star.
- Real MQTT telemetry is the only live source; the simulator is dev-only and always labeled.
- Roles are fixed (Manager/Engineer/Viewer), admin-assigned, never self-selected at signup.

## Next
Start **Part 5 — Manager UI: Dashboards, Drill-down, Alerts, Reports & Live Updates** (see build-spec.md). Enter plan mode first. Build the Next.js app on top of Parts 1–4: auth-guarded pages (redirect to /login on unrecoverable 401), a real KPI dashboard (numbers equal `/api/kpis`) with drill-down from a KPI → machine → "create work order", an alert center, work-order list/detail screens (create/assign/advance via the typed `lib/api`, role-gated controls hidden from Viewers), report export matching the dashboard, and live updates via an **authenticated Socket.IO handshake** (Express owns the socket server; connect only with a valid token; push live health/KPI/alert/work-order changes). No fake data anywhere (grep-clean); rename any misspelled component files. Frontend Vitest + Testing Library harness gets set up here (it was deferred from Parts 1–4). Backend gains the Socket.IO server + emit points on ingest/alert/work-order changes.

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

### Part 3 notes (done 2026-07-08)
- **Pure KPI engine (`services/kpi.js`), deterministic, no clock:** `computeAvailability` `computePerformance` `computeQuality` (each a proper fraction in [0,1] via `clampFraction`), `computeOEE = A×P×Q`, `computeMTBF({operatingMs,failures})` (hours; 0 failures → 0 not NaN/Infinity), `computeMTTR(intervals)` (mean of `{startMs,endMs}` durations in hours — **source-agnostic** so Part 4 can pass work-order repair intervals). Fixes the audit's "wrong OEE/MTBF math": every ratio is time/time or count/count, no subtracting hours from percentages.
- **Orchestrators:** `computeMachineKPIs(machine,{readings,alerts,workOrders,windowStart,windowEnd})` derives inputs from real data — downtime = union of Critical-alert intervals clamped to the window (merged, no double-count); runTime = planned − downtime; failures = count of Critical alerts whose onset is in-window (a Critical-status machine ⟺ its open Critical alert ⇒ **counted once**); MTTR from resolved-Critical-alert recovery (or work-order intervals when present). `computePlantKPIs(machines,datasets)` rolls up (mean availability, mean OEE over data-complete machines, total-operating/total-failures MTBF).
- **OEE made real, not faked (honors "no fake numbers"):** OEE needs production+quality data the telemetry lacked, so extended the ingest metric registry with production counters `unitsTotal`/`unitsGood` (per-report increments, unit "count") and added `machine.ratedThroughput` (units/hr). Performance = produced/(rated×runtime), Quality = good/total. A machine without production data → `dataComplete:false` and `oee:null` (flagged, never invented). Only `source:"device"` (live) readings feed production KPIs; sim readings are excluded.
- **Endpoint:** `GET /api/kpis` mounted in `app.js`, behind `authMiddleware` + `permissionMiddleware("dashboard:read")` (all 3 roles hold it). Query `from`/`to`/`windowHours` (default 24h, max 90d) + optional `machineId`; returns `{ success, window, plant, machines[] }`. Single-plant v1 = every authed caller sees the one plant (multi-tenant scoping deferred).
- **Spec tension resolved (flagged decision):** spec sources KPIs from "readings/alerts/work orders" but work orders are Part 4 (forward dep) and telemetry had no production counts. Chose: availability/MTBF/MTTR from Part 2 alert data now; OEE real via ingested production counters; MTTR forward-compatible with Part 4 work orders. Did NOT block for owner input (user was AFK, said choose the best).
- **Tests:** `src/test/kpi.test.js` = 12 (OEE=A×P×Q hand value 0.48; availability clamp ≤100% no unit-mix; perf/quality clamp; MTBF real op-time + MTTR mean; empty-window→zeros-not-NaN; per-machine hand-check; failure dedup; incomplete-data flag; sim excluded; plant empty rollup; endpoint 401 unauth + 200 authed). Full backend suite **43 green**; frontend typecheck exit 0. Manual spot-check (live MQTT ingest → `/api/kpis`): endpoint == hand-computed exactly (avail 0.75 / perf 0.9 / qual 0.8 / OEE 0.54 / MTBF 6h / MTTR 2h / 1 failure).

### Part 4 notes (done 2026-07-09)
- **Rebuild-canon WorkOrder model** (`models/workOrder.js`): rewrote the ~30-field legacy model to the spec shape `{ machineId, title, description, priority ∈ Low/Medium/High/Critical, status ∈ Open/Assigned/In Progress/Resolved, assigneeId, createdBy, linkedAlertId, resolvedAt, history[{from,to,by,at}] }` + `timestamps`. Exports `WORK_ORDER_STATUSES`, `ACTIVE_WORK_ORDER_STATUSES` (= not-Resolved), `WORK_ORDER_PRIORITIES`. **At most one active WO per machine** enforced by a partial unique index `{machineId:1}` where status∈active PLUS an app-level pre-check (clean 409). ⚠️GOTCHA: do NOT also put field-level `index:true` on machineId — a second same-key index → IndexOptionsConflict on build that destabilizes the Mongo connection.
- **Pure domain helpers** (`services/workOrders.js`): `isValidTransition(from,to)` = forward-only single-step along `Open→Assigned→In Progress→Resolved` (rank+1, no skip/backward); `scopeForUser(user)` = `{assigneeId:self}` for Engineer / `{}` for Manager+Viewer (single-plant "scope every query to the caller"); `findActiveWorkOrderForMachine`; `serializeWorkOrder`.
- **Clean controller** (`controllers/workOrderController.js`): list/get (scoped; out-of-scope → 404, no existence leak), create (Manager: whitelist machineId/title/description/priority/assigneeId/linkedAlertId; **createdBy from token never body**; assignee must be a real user → 400; machine must exist → 404; one-active → 409; assignee present ⇒ status Assigned else Open), update (Manager+Engineer: **status transition validated**, → Resolved sets `resolvedAt`; Manager-only can (re)assign + edit metadata; Engineers' owner/metadata fields **silently ignored** = mass-assignment guard; createdBy/machineId/linkedAlertId never read from body).
- **Routes** (`routes/workOrderRoutes.js`) mounted at `/api/workorders` in `app.js`: `GET /` + `GET /:id` behind new `anyPermissionMiddleware(["workorders:read","workorders:manage"])` (Manager holds `manage` not the literal `read`, so read-or-manage); `POST /` behind `roleMiddleware(["Manager"])` (Engineers don't create → 403, Viewers → 403); `PATCH /:id` behind `permissionMiddleware("workorders:manage")` (Manager+Engineer; Viewer → 403). Added `anyPermissionMiddleware` to `middleware/permissionMiddleware.js`.
- **Closed the loop into Part 3 MTTR:** `kpiController` now also fetches `WorkOrder.find({status:"Resolved", resolvedAt:in-window})` and passes `workOrders` into the KPI datasets; `computeMachineKPIs` already prefers WO `createdAt→resolvedAt` repair intervals for MTTR when present. Verified end-to-end: a backdated resolved WO (2h) → machine `mttrHours ≈ 2` via `/api/kpis`.
- **Deleted** superseded legacy `services/workOrderService.js` (imported the deleted `predictionService.js`); only dormant/never-loaded `iot/telemetryProcessor.js` still references it (same bucket as the other Part-2 dormant-broken legacy). Legacy `reportController.js` (unmounted) uses only `WorkOrder.find().lean()` → unaffected by the shape change.
- **Test-infra fix (helps all future test files):** raised `RATE_LIMIT_MAX`/`AUTH_RATE_LIMIT_MAX`/`BRUTE_FORCE_MAX_FAILURES` in `test/helpers.js` `TEST_ENV`. The auth route limiter caps at 25 (`AUTH_RATE_LIMIT_MAX||25`); a shared-app test file doing 4 logins/test tripped 429 → cascading undefined-token 401s after ~6 tests. ⚠️GOTCHA for test fixtures: Mongoose marks `createdAt` **immutable** under `timestamps`, so backdating needs `Model.collection.updateOne(...)` (native driver), not `Model.updateOne(...)`.
- **Tests:** `src/test/workOrders.test.js` = 14 (manager create→Assigned+linked machine/alert; create w/o assignee→Open; engineer forward step ok + resolvedAt; skip/backward→400; engineer can't touch another's WO→404 scoped; viewer create 403; viewer update 403; mass-assignment createdBy/machineId ignored; duplicate active→409; resolve frees machine; list scoped engineer-vs-manager; unknown machine 404; unauth 401; resolved-WO MTTR via `/api/kpis`). Full backend suite **57 green**; frontend typecheck + eslint exit 0. Manual checklist walked live (alert→WO→assign→advance→Resolved, one-active 409, viewer 403, backward 400, history recorded) — all correct.
