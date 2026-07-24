# KAVACH v1.0.0 Release Checklist

Status: prepared for release, not deployed or pushed automatically.

## Configuration

- [x] Root package metadata set to `1.0.0`.
- [x] Frontend package metadata set to `1.0.0`.
- [x] Backend package metadata set to `1.0.0`.
- [x] `.env.example` and `backend/.env.example` set `API_VERSION=1.0.0` and `APP_RELEASE=1.0.0`.
- [x] Render blueprint sets `API_VERSION=1.0.0`.
- [x] No real `.env`, `.env.local`, or `.env.production` files are tracked by Git.
- [x] Frontend example keeps `NEXT_PUBLIC_API_URL` blank for same-origin `/api` proxying.
- [x] Frontend example points `NEXT_PUBLIC_SOCKET_URL` and `API_URL` to the backend service.
- [x] Backend example includes MongoDB, JWT, CORS, rate-limit, IoT, MQTT, AI, VAPID, backup, audit, and cost variables.

## Required Pre-Deploy Operator Actions

- [ ] Confirm production MongoDB Atlas network access allows the backend host.
- [ ] Set production `MONGO_URI` in the backend host.
- [ ] Set unique production `JWT_SECRET` and `JWT_REFRESH_SECRET` values with at least 32 characters.
- [ ] Set `CORS_ORIGIN` to the final healthy frontend origin.
- [ ] Rotate or disable seeded admin credentials before real production use.
- [ ] Set `ENABLE_SENSOR_SIMULATION=false` for real production telemetry.
- [ ] Keep `IOT_ENABLED=false` unless MQTT broker credentials are intentionally configured.
- [ ] Store `DEVICE_SECRET`, VAPID private key, and backup restore token only in the hosting provider secret manager.
- [ ] Review the primary frontend alias `https://kavach-frontend.onrender.com`, which returned `503` during QA.

## Validation Gates

- [x] `npm run frontend:lint`
- [x] `npm run frontend:typecheck`
- [x] `npm run frontend:build`
- [x] `npm run backend:test`
- [x] `npm run verify`
- [x] `npm run verify:production`
- [x] Backend production dependency audit returned zero vulnerabilities.
- [x] Frontend production dependency audit returned zero vulnerabilities.

## Live QA Status

- [x] Backend `/api/health` returned healthy on `https://kavach-spgh.onrender.com`.
- [x] Backend root endpoint returned service metadata.
- [x] Invalid login and missing login inputs returned controlled errors.
- [x] Protected API routes returned `401` without a token.
- [x] Seeded admin login succeeded during QA.
- [x] Authenticated machines, predictive, executive, IoT, Smart Factory, reports, and AI overview APIs returned `200`.
- [x] Copilot plant-health query returned `200`.
- [x] Analytics CSV and weekly PDF report export returned `200`.
- [x] Invalid machine and predictive IDs returned `404`.
- [x] Socket.IO polling handshake returned `200`.
- [x] CORS preflight from `https://kavach-frontend-4s8e.onrender.com` returned `204`.
- [x] Healthy frontend route smoke passed on `https://kavach-frontend-4s8e.onrender.com`.
- [x] Invalid frontend route returned `404`.

## Production Smoke Test After Manual Deploy

- [ ] Open final frontend production URL.
- [ ] Log in with a production admin user.
- [ ] Verify Dashboard, Executive, Enterprise, Machines, Digital Twin, IoT, Smart Factory, Predictive, AI Copilot, Analytics, Reports, Audit, Settings, and System.
- [ ] Verify Socket.IO connects from the browser with no CORS or mixed-content errors.
- [ ] Verify Digital Twin renders and playback controls work.
- [ ] Verify Predictive what-if simulation runs without mutating machine records.
- [ ] Verify AI Control Center recommendations require manual Approve/Reject review.
- [ ] Verify AI Vision camera dashboard and event timeline load.
- [ ] Submit controlled ESP32 telemetry to `/api/iot/sensor` or full telemetry to `/api/iot/telemetry`.
- [ ] Export one report and confirm audit logging.
- [ ] Confirm PWA manifest is detected and service worker registers.
- [ ] Confirm backend logs show no startup/runtime errors.

## Rollback Plan

1. Freeze new changes and capture failing frontend URL, backend URL, revision IDs, and timestamp.
2. If `/api/health`, login, or database-backed APIs fail, roll back the backend first.
3. If pages fail while API health is good, roll back the frontend first.
4. Restore previous hosting environment variables if a config-only change caused the incident.
5. If IoT ingestion causes instability, set `IOT_ENABLED=false` and disable MQTT while keeping REST health online.
6. Do not restore database data without an approved backup/restore plan.
7. Re-run the production smoke test after rollback.
