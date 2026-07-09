# KAVACH Enterprise SaaS

KAVACH is deployable as an enterprise Industrial Decision Intelligence platform with:

- RBAC and plant-scoped access
- Multi-plant tenant hierarchy
- MQTT and REST IoT telemetry ingestion
- Audit logs
- Report center with PDF, Excel, and CSV exports
- OpenAPI documentation and Swagger UI
- System health and observability dashboards
- Backup export and restore dry-run workflow

## Production Start

```bash
docker compose up --build -d
```

See `DEPLOYMENT.md` for environment variables, health checks, backup, and reverse proxy details.
