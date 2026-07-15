# KAVACH Production Deployment

This guide prepares KAVACH for a production split deployment:

- Frontend: Vercel, root directory `frontend`
- Backend: Render or Railway, root directory `backend`
- Database: MongoDB Atlas
- Realtime: Socket.IO over HTTPS/WSS
- IoT: ESP32 posts to the backend `/api/iot/sensor` endpoint

Do not put backend secrets in Vercel or in any `NEXT_PUBLIC_` variable.

## Required Checks

Run from the repository root before every production deploy:

```bash
npm run verify
```

Run the dependency audit before release approval:

```bash
npm run verify:production
```

`verify` runs frontend lint, frontend typecheck, frontend production build, and backend tests. `verify:production` adds production dependency audits for both apps.

## Frontend on Vercel

Use the existing `frontend/vercel.json`.

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Root directory | `frontend` |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `.next` |
| Node.js | `22.x` from `frontend/package.json` |

Set these Vercel environment variables for Production, Preview, and Development as appropriate:

```env
NEXT_PUBLIC_API_URL=https://your-backend-service.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-service.onrender.com
API_URL=https://your-backend-service.onrender.com
```

For Railway backend, use the Railway public HTTPS backend URL instead.

The frontend config:

- keeps local/private HTTP URLs usable for ESP32 LAN testing
- upgrades public HTTP backend URLs to HTTPS
- rewrites `/api/*` to the backend when `API_URL` or `NEXT_PUBLIC_API_URL` is configured
- disables `X-Powered-By`
- disables production browser source maps
- adds browser security headers
- lazy-loads heavy dashboard/3D/chart panels with skeleton fallbacks

## Backend on Render

Use `render.yaml` from the repository root.

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | `backend` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm run start` |
| Health check path | `/api/health` |
| Node.js | `22.x` from `backend/package.json` |

Required Render environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<random-32-plus-character-secret>
JWT_REFRESH_SECRET=<different-random-32-plus-character-secret>
CORS_ORIGIN=https://your-vercel-app.vercel.app
CORS_CREDENTIALS=true
PUBLIC_API_BASE_URL=https://your-backend-service.onrender.com
DEVICE_SECRET=<random-device-secret>
```

Recommended production variables are listed in `.env.example` and `backend/.env.example`.

## Backend on Railway

Use `backend/railway.json`.

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Builder | Nixpacks |
| Build command | `npm ci --omit=dev` |
| Start command | `npm run start` |
| Health check path | `/api/health` |

Set the same backend variables listed for Render. Use the Railway public service URL in:

```env
PUBLIC_API_BASE_URL=https://your-railway-backend.up.railway.app
```

Then set Vercel:

```env
NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-railway-backend.up.railway.app
API_URL=https://your-railway-backend.up.railway.app
```

## MongoDB Atlas

1. Create a production database user with least required read/write access.
2. Put the database name in the `MONGO_URI` path.
3. URL-encode special characters in the password.
4. Configure Atlas Network Access for the backend host.
5. Verify backend logs include `mongodb_connected`.
6. Never commit `MONGO_URI`.

The backend refuses to start the HTTP server if MongoDB cannot connect.

## CORS and Socket.IO

Backend CORS must point to the exact Vercel frontend origin:

```env
CORS_ORIGIN=https://your-vercel-app.vercel.app
CORS_CREDENTIALS=true
```

The same CORS options are used for Express and Socket.IO. Supported methods are:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Supported headers are:

```text
Content-Type, Authorization
```

If the frontend uses a custom domain, add that domain to `CORS_ORIGIN`. Multiple origins can be comma-separated.

## ESP32 Production Telemetry

The ESP32 should post to the deployed backend:

```text
https://your-backend-service.onrender.com/api/iot/sensor
```

For LAN development, local HTTP URLs are still supported by the frontend config and ESP32 sketch. For production, use HTTPS.

Expected telemetry verification:

1. ESP32 receives HTTP `200` from `/api/iot/sensor`.
2. MongoDB stores telemetry for `deviceId`.
3. Backend emits `sensor-update`.
4. Dashboard Live Sensor Data updates temperature, humidity, status, and timestamp.

## Health Checks

Public health endpoint:

```text
GET /api/health
```

Use it for Render/Railway health checks and post-deploy smoke tests.

Authenticated diagnostics remain under:

```text
GET /api/system/health
```

## Security Checklist

- Use long, different `JWT_SECRET` and `JWT_REFRESH_SECRET` values.
- Keep `MONGO_URI`, JWT secrets, `DEVICE_SECRET`, `OPENAI_API_KEY`, and restore tokens server-side only.
- Set `NODE_ENV=production` on the backend.
- Set exact `CORS_ORIGIN`; do not use `*` in production.
- Rotate seeded/demo credentials before real use.
- Keep `IOT_ENABLED=false` unless MQTT is intentionally configured.
- Keep `ENABLE_SENSOR_SIMULATION=false` in production when using real ESP32 data.
- Review `npm run verify:production` audit output before release.

## Production Smoke Test

After deployment:

1. Open the Vercel frontend.
2. Open backend `/api/health`.
3. Log in.
4. Confirm dashboard data loads.
5. Confirm Socket.IO connects with WSS and no CORS errors.
6. Confirm Machines, IoT, Analytics, Alerts, Copilot, Reports, Settings, and Logout.
7. Send ESP32 telemetry and confirm the Live Sensor Data card updates.
8. Check browser console for mixed-content, CORS, and hydration errors.
9. Check backend logs for MongoDB, unhandled errors, and rate-limit noise.

## Rollback

Roll back frontend and backend independently:

1. Roll back backend if API health or login fails.
2. Verify `/api/health`.
3. Roll back frontend if browser rendering or client routing fails.
4. Re-run the production smoke test.
