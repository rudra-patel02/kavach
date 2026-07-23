# KAVACH Release Checklist

## Configuration

- [ ] Production MongoDB connection is configured in the backend host.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique production secrets with at least 32 characters.
- [ ] `CORS_ORIGIN` is set to the exact frontend production origin.
- [ ] Frontend `NEXT_PUBLIC_API_URL` is blank unless intentionally bypassing Next.js rewrites.
- [ ] Frontend `NEXT_PUBLIC_SOCKET_URL` is blank for same-origin Docker/nginx deployments, or points to the backend production URL for split hosting.
- [ ] Frontend `API_URL` points to the backend production URL for Next.js `/api/*` rewrites.
- [ ] IoT and MQTT variables are configured only if device ingestion is enabled.
- [ ] `ENABLE_SENSOR_SIMULATION=false` unless running an approved demo environment.
- [ ] Optional AI provider variables are configured only if external AI calls are intended.
- [ ] Optional VAPID variables are configured only if browser push delivery is enabled.
- [ ] Backup, audit retention, and restore token values are configured for production operations.

## Validation

- [ ] `npm run frontend:typecheck`
- [ ] `npm run frontend:lint`
- [ ] `npm run frontend:build`
- [ ] `npm run backend:test`
- [ ] Backend starts with `NODE_ENV=production`.
- [ ] `/api/health` returns healthy after deployment.
- [ ] `/api/docs/openapi.json` is reachable in the deployed environment.
- [ ] Login, refresh, and logout work against the production backend.
- [ ] Protected routes redirect unauthenticated users to `/login`.
- [ ] Socket.IO connects from the production frontend.
- [ ] System page renders without runtime errors.
- [ ] Digital Twin renders, machines are clickable, sensor overlays update, and production flow animates.
- [ ] Smart Factory protocol health, QR lookup, AI Vision camera dashboard, and event timeline load.
- [ ] Predictive what-if simulation runs without mutating machine records.
- [ ] Automated executive report can be generated.
- [ ] ESP32 `/api/iot/sensor` path still accepts valid device telemetry.

## Deployment

- [ ] Frontend is deployed from `frontend` on Vercel.
- [ ] Backend is deployed from `backend` on Render or Railway.
- [ ] Managed MongoDB network access allows the backend service.
- [ ] Production domain and TLS are configured.
- [ ] CORS and cookie behavior are verified on the final production domains.
- [ ] Logs and monitoring are enabled for frontend and backend services.
- [ ] Database backup schedule is enabled and tested.
- [ ] Rollback plan below has assigned owners and tested access to Vercel/Render/Railway/MongoDB.

## Security

- [ ] No `.env` files are committed.
- [ ] No API keys, passwords, database URLs, or JWT secrets are committed.
- [ ] Device shared secret is rotated before production device onboarding.
- [ ] Restore token is stored only in the hosting provider secret manager.
- [ ] Public demo/test users are removed or disabled.
- [ ] Rate limits and brute-force protection are enabled.

## Post-release Smoke Test

- [ ] Open frontend production URL.
- [ ] Log in with a production admin user.
- [ ] Verify dashboard, machines, work orders, alerts, reports, settings, and system pages.
- [ ] Verify Smart Factory, Digital Twin, Predictive Simulation, IoT Devices, and AI Vision workflows.
- [ ] Submit a controlled AI Vision PPE/fire/smoke/intrusion demo event and confirm a safety alert is created.
- [ ] Confirm PWA manifest is detected and service worker registers.
- [ ] Export one report or backup in a controlled environment.
- [ ] Confirm backend logs show no startup/runtime errors.

## Rollback Plan

1. Freeze new changes and capture the failing deployment URL, backend revision, frontend revision, and timestamp.
2. If `/api/health`, login, or database-backed APIs fail, roll back the backend service first.
3. If pages fail to render, navigation breaks, or client assets are bad while APIs are healthy, roll back the frontend deployment.
4. If a migration-free config change caused the issue, restore the previous hosting environment variables and redeploy the last known good revision.
5. If IoT ingestion causes instability, set `IOT_ENABLED=false` and disable MQTT ingestion while keeping REST health and dashboards online.
6. Re-run the post-release smoke test after rollback.
7. Keep the database unchanged unless a verified backup/restore plan has been approved for the incident.
