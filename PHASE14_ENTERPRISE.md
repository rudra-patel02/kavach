# KAVACH Phase 14 Enterprise Operations

Phase 14 expands KAVACH into a multi-tenant enterprise industrial operations platform.

## Backend

Primary API namespace: `/api/enterprise`

Implemented domains:

- Tenants, organizations, regions, plants, areas
- Enterprise asset registry and lifecycle
- Engineer/team management and automatic work-order assignment
- Fleet intelligence and cross-plant analytics
- Executive command KPIs and revenue impact
- Enterprise alert ownership, comments, escalation metadata
- Notification rules with email, SMS, push, Slack, Teams, webhook architecture
- Report schedules for PDF, Excel, CSV delivery
- Audit-log access through the enterprise namespace

Key endpoints:

- `GET /api/enterprise/dashboard`
- `GET /api/enterprise/fleet`
- `GET /api/enterprise/analytics/cross-plant`
- `GET|POST /api/enterprise/organizations`
- `GET|POST /api/enterprise/regions`
- `GET|POST /api/enterprise/plants`
- `GET|POST /api/enterprise/areas`
- `GET|POST /api/enterprise/assets`
- `PATCH /api/enterprise/assets/:assetId/lifecycle`
- `GET|POST /api/enterprise/engineers`
- `POST /api/enterprise/workorders/:workOrderId/auto-assign`
- `GET /api/enterprise/alerts`
- `POST /api/enterprise/alerts/:id/comments`
- `GET|POST /api/enterprise/notification-rules`
- `GET|POST /api/enterprise/report-schedules`
- `GET /api/enterprise/audit`

Realtime events:

- `enterprise:dashboard:refresh`
- `enterprise:fleet:update`
- `enterprise:maintenance:update`

## Frontend

Primary workspace: `/enterprise`

Pages:

- `/enterprise`
- `/enterprise/organizations`
- `/enterprise/plants`
- `/enterprise/fleet`
- `/enterprise/executive`
- `/enterprise/workorders`
- `/enterprise/engineers`
- `/enterprise/notifications`
- `/enterprise/audit`
- `/enterprise/reports`
- `/enterprise/settings`

The workspace uses the existing dark enterprise design system, realtime Socket.IO refresh, animated KPI cards, charts, responsive tables, search, and create actions for enterprise records.
