# KAVACH — Deployment

Single-host Docker Compose. **Only nginx (port 80) is published**; the API,
Socket.IO, the Next.js app, MongoDB and the MQTT broker all stay on the internal
compose network. Mongo requires credentials, containers run as non-root, prod
images ship no dev dependencies, and the backend refuses to boot on a
placeholder/short secret or a wildcard CORS origin.

## Services

- `nginx` — the only public entrypoint; proxies `/api` and `/socket.io` to the
  backend and everything else to the frontend (`nginx/kavach.conf`).
- `frontend` — Next.js standalone server (internal `:3000`).
- `backend` — Express API + MQTT ingest + Socket.IO (internal `:5000`).
- `mongo` — MongoDB with root credentials (internal `:27017`, not published).
- `mqtt` — Mosquitto broker (internal `:1883`, not published by default).

## 1. Configure secrets

Copy the example and fill in **real, random** values (the backend will refuse to
start otherwise):

```bash
cp .env.example .env
# generate strong secrets:
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET
openssl rand -hex 32   # → DEVICE_SECRET
```

Required in `.env`: `MONGO_ROOT_USERNAME`, `MONGO_ROOT_PASSWORD`, `JWT_SECRET`,
`JWT_REFRESH_SECRET`, `DEVICE_SECRET`, and `PUBLIC_ORIGIN` (the URL the app is
served from, e.g. `https://kavach.example.com`). `.env` is gitignored.

## 2. Start

```bash
docker compose up --build -d
```

The app is then reachable only at `http://<host>/` (nginx). Direct access to the
backend, Mongo, or the broker from the host is blocked (no published ports).

## 3. Verify

- Health through nginx: `curl http://<host>/api/health` → `{"success":true,...}`
- Confirm Mongo is not reachable from the host (`nc -z <host> 27017` fails).
- The Socket.IO handshake rejects a connection with no/invalid token.

## Seed a first Manager

Registration always creates a Viewer. Create the first Manager directly, e.g.:

```bash
docker compose exec backend node src/seed.js   # seeds demo machines
# then register a user and promote it to Manager in the DB, or use an admin
# bootstrap step of your choosing.
```

## Notes

- The dev-only telemetry **simulator** is off by default
  (`ENABLE_SENSOR_SIMULATION=false`); turn it on only for a demo — its readings
  are always labelled `sim` and never counted as live when off.
- To ingest from **real external devices**, deliberately publish the MQTT port
  and enable broker authentication in `deployment/mosquitto.conf`.
- CI (`.github/workflows/ci.yml`) runs install → tests → typecheck → lint →
  build → `npm audit` (fails on High/Critical) on every push and PR.
