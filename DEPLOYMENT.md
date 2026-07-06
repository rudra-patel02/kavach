# KAVACH Production Deployment

## Services

- Frontend: Next.js
- Backend: Node.js/Express
- Database: MongoDB
- Realtime: Socket.IO
- IoT: MQTT
- Reverse proxy: Nginx

## Required Secrets

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `MONGO_URI`
- `DEVICE_SECRET`
- `MQTT_BROKER_URL`
- `CORS_ORIGIN`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`

## Start

```bash
docker compose up --build -d
```

## Health Checks

- Backend health: `/api/health`
- Enterprise health dashboard: `/api/system/health`
- API docs: `/api/docs`

## Backup

- Export database snapshot: `GET /api/backup/export`
- Export configuration: `GET /api/backup/configuration`
- Restore dry run: `POST /api/backup/restore`

Restore execution is intentionally guarded and should be performed during an approved maintenance window.
