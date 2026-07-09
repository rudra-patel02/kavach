# KAVACH Phase 15-18 Enterprise Completion

## Phase 15 - Work Order Management

- Added CMMS-compatible work order fields and aliases for `createdBy`, `maintenanceType`, `estimatedHours`, `actualHours`, `costEstimate`, `scheduledDate`, `completedDate`, `checklist`, and `approvalStatus`.
- Added explicit work order operations for status updates, assignment, completion, print view, PDF export, and Excel-compatible CSV export.
- Extended the Work Orders UI with dashboard, create form, engineer queue, completed jobs, checklist updates, approval details, print, and export actions.

## Phase 16 - Notification Center

- Added enterprise notification types, cursor pagination, search/filter support, archive/unarchive APIs, manual notification creation, preferences, and audit logging.
- Extended the notification drawer with archive actions, load more, desktop notifications, toast notifications, and sound preference support.

## Phase 17 - RBAC

- Added Quality Engineer support and expanded permission modules across dashboard, machines, analytics, copilot, digital twin, work orders, reports, notifications, users, settings, and audit.
- Added JWT permission claims, permission-aware middleware, user CRUD APIs, and a frontend RBAC console with role/status editing and a permission matrix.

## Phase 18 - Audit And Security

- Added browser, location, session ID, severity, and retention metadata to audit logs.
- Added filtered audit search plus CSV, Excel-compatible CSV, and PDF exports.
- Added frontend audit summaries, severity filters, export actions, and richer security columns.

## Cross-Cutting UX And Reliability

- Added route error boundary, app loading skeleton, persisted dark theme hook, breadcrumb navigation, recent actions, command-palette search focus, and GET retry handling.
- Updated OpenAPI metadata for Phase 15-18 endpoints.

## Validation

Run:

```bash
npm --prefix backend run test
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run build
```
