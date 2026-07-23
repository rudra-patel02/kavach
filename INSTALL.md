# KAVACH Installation Guide

This guide sets up KAVACH for local development and production-like verification.

## Requirements

- Node.js `22.x`
- npm `10+`
- Git
- MongoDB Atlas or local MongoDB
- Optional: MQTT broker for IoT ingestion
- Optional: VAPID key pair for browser push notifications

Check versions:

```bash
node --version
npm --version
git --version
```

## Clone and Install

```bash
git clone <repository-url>
cd KAVACH_Backup
npm --prefix backend install
npm --prefix frontend install
```

The root `package.json` provides convenience scripts, but dependencies are installed in `backend` and `frontend`.

## Environment Setup

Create backend and frontend environment files from the root examples.

Backend local file:

```text
backend/.env
```

Minimum backend values:

```env
NODE_ENV=development
PORT=5000
APP_RELEASE=4.0.0
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
JWT_REFRESH_SECRET=replace-with-a-second-random-secret-at-least-32-characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
IOT_ENABLED=false
ENABLE_SENSOR_SIMULATION=false
DEVICE_SECRET=replace-with-device-shared-secret
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:ops@example.com
```

Frontend local file:

```text
frontend/.env.local
```

Minimum frontend values:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
API_URL=http://localhost:5000
```

For production builds, use HTTPS URLs:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
API_URL=https://kavach-spgh.onrender.com
```

## Database Setup

Use MongoDB Atlas for the closest production match.

1. Create a cluster.
2. Create a database user.
3. Add a network access rule for your development machine.
4. Copy the connection string into `MONGO_URI`.
5. Include the database name in the URI path.

Example shape:

```env
MONGO_URI=mongodb+srv://kavach_user:<password>@cluster.example.mongodb.net/kavach
```

Do not commit real connection strings.

## Seed Data

Run the backend seed script after configuring `MONGO_URI`:

```bash
npm run backend:seed
```

For the full enterprise demo dataset, use the authenticated enterprise demo endpoint after login:

```text
POST /api/enterprise/demo/generate
```

The enterprise demo includes tenants, plants, machines, predictive alerts, work orders, IoT-linked assets, AI Vision cameras, and AI Vision timeline events.

If the admin-only seed script is needed:

```bash
npm --prefix backend run seed:admin
```

Expected seeded admin:

```text
Email: admin@kavach.com
Password: admin123
```

Passwords must be stored as bcrypt hashes.

## Run Locally

Terminal 1:

```bash
npm run backend:dev
```

Terminal 2:

```bash
npm run frontend:dev
```

Open:

```text
http://localhost:3000
```

Backend health:

```text
http://localhost:5000/api/health
```

Swagger UI:

```text
http://localhost:5000/api/docs
```

## Production-Like Local Build

```bash
npm run frontend:lint
npm run frontend:typecheck
npm run frontend:build
npm run backend:test
```

Or run the complete release gate:

```bash
npm run verify
```

Start production builds locally:

```bash
npm run backend:start
npm run frontend:start
```

## Docker Compose Reference

The repository includes `docker-compose.yml` for containerized reference deployment. Review the file and environment values before use.

Typical flow:

```bash
docker compose up --build
```

Use production secrets through environment files or the orchestration platform. Do not bake secrets into images.

## Troubleshooting

### Backend fails before accepting requests

Check `MONGO_URI`. The backend waits for MongoDB before starting the HTTP server. Look for structured logs:

```text
mongodb_connect_attempt
mongodb_connect_start
mongodb_connected
```

### Login fails

Check:

- Admin user exists in MongoDB
- Password is bcrypt-hashed
- `JWT_SECRET` is set
- Frontend points to the correct API URL
- Backend CORS allows the frontend origin

### CORS errors

For local development, `CORS_ORIGIN` should match the frontend origin, usually:

```env
CORS_ORIGIN=http://localhost:3000
```

For production:

```env
CORS_ORIGIN=https://kavach-1-7749.onrender.com
```

### Mixed content errors

Production frontend variables must use HTTPS:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=https://kavach-spgh.onrender.com
API_URL=https://kavach-spgh.onrender.com
```

### Socket.IO does not connect

Check:

- `NEXT_PUBLIC_SOCKET_URL` points to the backend origin
- Backend CORS allows the frontend origin
- Browser network tab shows `wss://` in production
- Render backend is awake and healthy

### Push notifications do not enable

Check:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is set on the frontend
- backend VAPID variables are set before connecting a push sender
- the site is served over HTTPS or localhost
- the browser supports service workers and PushManager

### AI Vision dashboard is empty

Register a camera in Smart Factory, ingest a vision event through `/api/smart-factory/vision/events`, or generate enterprise demo data.

## Clean Verification

Before handing off a local setup:

```bash
npm run frontend:lint
npm run frontend:typecheck
npm run frontend:build
npm run backend:test
```
