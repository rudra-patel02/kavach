# KAVACH Production Deployment

This guide covers production deployment for the KAVACH frontend and backend, with Render as the expected hosting platform and MongoDB Atlas as the production database.

## Production Targets

| Service | URL |
| --- | --- |
| Frontend | `https://kavach-1-7749.onrender.com` |
| Backend | `https://kavach-spgh.onrender.com` |
| Health check | `https://kavach-spgh.onrender.com/api/health` |
| API docs | `https://kavach-spgh.onrender.com/api/docs` |
| Socket.IO | `wss://kavach-spgh.onrender.com/socket.io` |

## Deployment Prerequisites

- Node.js `22.x`
- npm `10+`
- MongoDB Atlas database
- Render account with access to this repository
- Production secrets generated before deployment
- Frontend and backend hosted on HTTPS domains

## Backend Deployment on Render

The repository includes `render.yaml` for the backend service.

Render backend settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | `backend` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm run start` |
| Health check path | `/api/health` |
| Node version | `22.x` from `backend/package.json` |

Required backend environment variables:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
CORS_ORIGIN=https://kavach-1-7749.onrender.com
CORS_CREDENTIALS=true
MONGO_CONNECT_ATTEMPTS=5
MONGO_CONNECT_RETRY_MS=5000
IOT_ENABLED=false
ENABLE_SENSOR_SIMULATION=false
DEVICE_SECRET=<strong-device-secret>
```

Optional backend variables:

```env
API_VERSION=20.0.0
MONGO_MAX_POOL_SIZE=20
MONGO_MAX_IDLE_TIME_MS=60000
MONGO_SERVER_SELECTION_TIMEOUT_MS=10000
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=600
AUTH_RATE_LIMIT_MAX=25
BRUTE_FORCE_WINDOW_MS=900000
BRUTE_FORCE_MAX_FAILURES=8
OPENAI_API_KEY=
AI_PROVIDER=offline
OPENAI_MODEL=gpt-4o-mini
MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=kavach-backend-prod
```

## Frontend Deployment on Render

Create a separate Render web service for `frontend`.

Recommended frontend settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | `frontend` |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start` |
| Node version | `22.x` from `frontend/package.json` |

Required frontend environment variables:

```env
NEXT_PUBLIC_API_URL=https://kavach-spgh.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
```

Do not include backend secrets in frontend variables. Any variable prefixed with `NEXT_PUBLIC_` is bundled for the browser.

## MongoDB Atlas Configuration

1. Create or select the production Atlas cluster.
2. Create a database user with read/write access to the KAVACH database.
3. Use a database-specific connection string in `MONGO_URI`.
4. Configure Atlas Network Access for the Render backend.
5. Confirm the URI does not contain placeholder tokens such as `<user>` or `<password>`.
6. Confirm the backend logs show `mongodb_connected` before requests are served.

If the backend repeatedly logs MongoDB connection failures, check:

- Atlas username/password
- Database user permissions
- Network access allowlist
- Database name in the URI path
- Special characters in passwords that need URL encoding
- Render environment variable value copied without quotes or trailing spaces

## CORS and Socket.IO

Production backend CORS must allow exactly:

```env
CORS_ORIGIN=https://kavach-1-7749.onrender.com
CORS_CREDENTIALS=true
```

The backend applies the same CORS policy to Express and Socket.IO. Allowed methods are:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Allowed headers are:

```text
Content-Type, Authorization
```

Preflight requests are handled by Express with `OPTIONS` support.

## HTTPS and Mixed Content

Production frontend API helpers enforce HTTPS. Production variables must still be configured correctly:

```env
NEXT_PUBLIC_API_URL=https://kavach-spgh.onrender.com
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
```

The browser should show API calls to `https://kavach-spgh.onrender.com` and Socket.IO connections upgraded to `wss://kavach-spgh.onrender.com`.

## Seeding and Admin Access

For production, seed or repair the admin user only through an approved one-time process. The valid admin account is:

```text
Email: admin@kavach.com
Password: admin123
```

The stored password must be a bcrypt hash. Rotate this password after the first successful production login.

## Deployment Checklist

Before deploying:

- `npm run frontend:lint`
- `npm run frontend:typecheck`
- `npm run frontend:build`
- `npm run backend:test`
- Confirm `.env.example` has no real secrets
- Confirm frontend env points to HTTPS backend
- Confirm backend `CORS_ORIGIN` points to the production frontend
- Confirm `MONGO_URI` is set in Render and works from backend logs

After deploying:

- Open `/api/health`
- Open `/api/docs`
- Log in from the production frontend
- Confirm API requests use `https://kavach-spgh.onrender.com`
- Confirm Socket.IO connects over WSS
- Confirm dashboard, machines, analytics, alerts, audit, profile, notifications, and logout
- Confirm no browser mixed-content or CORS errors

## Rollback

Render supports redeploying a previous successful deploy from the service deploy history. Roll back frontend and backend independently if only one service is affected.

Rollback order for API-breaking releases:

1. Roll back backend.
2. Verify `/api/health`.
3. Roll back frontend if browser flows still fail.
4. Confirm login and dashboard again.

## Operational Monitoring

Monitor:

- Backend logs for MongoDB connection attempts and errors
- HTTP 4xx/5xx rates
- Socket.IO connection count from `/api/system/health`
- Atlas connection and query metrics
- Render deploy and restart events
- Browser console during production QA

## Security Notes

- Keep JWT secrets long, random, and different from each other.
- Keep `MONGO_URI` and `DEVICE_SECRET` server-side only.
- Use HTTPS-only production endpoints.
- Rotate seeded credentials after initial access.
- Remove temporary repair endpoints immediately after use.
- Restrict MongoDB Atlas network access to production infrastructure where possible.
