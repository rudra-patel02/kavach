# KAVACH Release Checklist

## Configuration

- [ ] Production MongoDB connection is configured in the backend host.
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique production secrets with at least 32 characters.
- [ ] `CORS_ORIGIN` is set to the exact frontend production origin.
- [ ] Frontend `NEXT_PUBLIC_API_URL` points to the backend production URL.
- [ ] Frontend `NEXT_PUBLIC_SOCKET_URL` points to the backend production URL.
- [ ] IoT and MQTT variables are configured only if device ingestion is enabled.
- [ ] `ENABLE_SENSOR_SIMULATION=false` unless running an approved demo environment.
- [ ] Optional AI provider variables are configured only if external AI calls are intended.
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

## Deployment

- [ ] Frontend is deployed from `frontend` on Vercel.
- [ ] Backend is deployed from `backend` on Render or Railway.
- [ ] Managed MongoDB network access allows the backend service.
- [ ] Production domain and TLS are configured.
- [ ] CORS and cookie behavior are verified on the final production domains.
- [ ] Logs and monitoring are enabled for frontend and backend services.
- [ ] Database backup schedule is enabled and tested.
- [ ] Rollback plan is documented for the release.

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
- [ ] Export one report or backup in a controlled environment.
- [ ] Confirm backend logs show no startup/runtime errors.
