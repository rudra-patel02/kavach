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
- [ ] Part 2 — Telemetry Ingest, Health & Alerts
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
Start **Part 2 — Telemetry Ingest, Health & Alerts** (see build-spec.md). Enter plan mode first.

### Part 1 notes (done 2026-07-08)
- Auth spine: register (always Viewer; ignores role/permissions/tenant), login (access+refresh), refresh, logout. JWT pinned to HS256 everywhere; access token carries only `{id, name, email, role}` (permissions derived server-side from `security/rbac.js`). Roles = Manager/Engineer/Viewer (user model enum + `USER_MANAGEMENT_ROLES`). Admin create-user is `users:manage`-guarded; Viewer is 403.
- Secrets: `backend/.env` untracked + gitignored; JWT_SECRET/JWT_REFRESH_SECRET rotated; `getRefreshSecret()` placeholder fallback removed. **Deferred (per owner): purge `backend/.env` from git history** — the rotation already invalidates the old secret.
- Scope reset: `src/app.js` factory mounts only `/api/auth` + `/api/users`; slim `index.js` (no MQTT/Socket.IO/sensor/backup in Part 1 — return in Parts 2–5). Deleted 16 out-of-scope routes + 17 controllers + 20 services + 12 legacy feature tests. Frontend: deleted 13 out-of-scope page trees + orphaned components; trimmed `lib/navigation.ts`.
- Tests: backend `node --test` = 13 green (`src/test/auth.test.js` covers the 6 DoD tests; kept `test/rbac.test.js`, `test/exportUtils.test.js`). Frontend typecheck clean.
- **Dormant legacy pending rebuild:** `machineController`/`workOrderController` still import `middleware/tenantMiddleware.js`; `workOrderService.js` still imports the deleted `predictionService.js` (latent — these files are unmounted/unloaded and get rebuilt in Parts 2/4). Frontend dashboard `app/page.tsx` still renders AI/3D widgets (Part 5 UI redesign). Frontend Vitest harness deferred to Part 5 (no Part 1 frontend tests).
