# Database Schema

KAVACH uses MongoDB with Mongoose models in `backend/src/models`. There is no relational migration system. Schema evolution is handled by additive Mongoose fields, defaults, indexes, and service-level compatibility logic.

## Core Collections

| Model | Collection Purpose |
| --- | --- |
| `User` | Authentication, RBAC role, tenant/plant context, notification preferences, refresh token |
| `Machine` | Machine registry, live telemetry snapshot, asset metadata, AI fields, prediction history, maintenance history |
| `WorkOrder` | Maintenance task lifecycle, assignment, priority, status, completion metadata |
| `Notification` | Alerts, warnings, safety messages, read/archive/delete workflows |
| `AuditLog` | Security, auth, data, export, and operational audit events |
| `Telemetry` / `SensorHistory` | Device and sensor readings |
| `Device` / `HeartbeatLog` / `ConnectionLog` | IoT device registry, heartbeat, and connectivity events |

## Enterprise Collections

| Model | Purpose |
| --- | --- |
| `Tenant` | Top-level tenancy boundary |
| `Organization` | Enterprise organization |
| `Plant` | Plant/site records |
| `Region` | Regional grouping |
| `Area` | Plant area |
| `Department` | Department metadata |
| `ProductionLine` | Production line metadata |
| `MachineGroup` | Machine grouping |
| `Asset` | Enterprise asset lifecycle metadata |
| `Engineer` | Engineer profiles and assignment data |
| `UserInvitation` | Enterprise invitation workflow |
| `OnboardingProgress` | Organization onboarding state |
| `FleetAnalytics` | Fleet analytics snapshots |

## AI and Predictive Collections

| Model | Purpose |
| --- | --- |
| `AIHistory` | AI analysis history |
| `Anomaly` | Anomaly detections |
| `Forecast` | Forecast output |
| `Prediction` | Prediction records |
| `RootCause` | Root cause analysis output |
| `MachineHealthSnapshot` | Machine health snapshots |
| `MaintenancePlan` | Maintenance planning data |

## Smart Factory and AI Vision Collections

| Model | Purpose |
| --- | --- |
| `AiVisionCamera` | Camera registration, enabled detections, status, location |
| `AiVisionEvent` | PPE, fire, smoke, intrusion, and other AI Vision events |

AI Vision events can create compatible notification records with `type: safety_warning`.

## Reports, Backup, Billing, and Push

| Model | Purpose |
| --- | --- |
| `ReportSchedule` | Automated report schedules |
| `ReportDeliveryLog` | Report delivery/run history |
| `BackupLog` | Backup export/restore history |
| `PushSubscription` | Browser push subscription storage |
| `NotificationRule` | Notification routing rules |
| `Plan`, `Subscription`, `Invoice` | Billing plans, tenant subscription state, invoices |

## User Schema Summary

Required:

- `name`
- `email`
- `password`

Important fields:

- `role`: `Admin`, `Super Admin`, `Organization Admin`, `Plant Admin`, `Plant Manager`, `Maintenance Manager`, `Engineer`, `Maintenance Engineer`, `Operator`, `Quality Engineer`, `Viewer`
- `tenantId`, `organizationId`, `plantIds`, `activePlantId`
- `status`: `Active`, `Inactive`, `Suspended`
- `permissions`
- `refreshToken`
- `notificationPreferences`
- `themePreference`: `dark` or `system`

Indexes:

- unique `email`
- partial unique `employeeId`
- tenant and plant fields

## Machine Schema Summary

Required:

- `machineId`
- `name`

Important groups:

- Enterprise scope: `tenantId`, `organizationId`, `regionId`, `plantId`, `departmentId`, `productionLineId`, `machineGroupId`, `areaId`, `assetId`
- Asset metadata: `serialNumber`, `manufacturer`, `model`, `installationDate`, `warrantyExpiry`, `criticality`, `assetValue`, `maintenanceCost`, `replacementCost`, `qrCode`, `barcode`, `lifecycleState`
- Live telemetry: `status`, `health`, `temperature`, `vibration`, `power`, `current`, `voltage`, `efficiency`, `rpm`, `humidity`, `pressure`, `oilLevel`, `noise`, `flowRate`, `gasSensor`, `energyConsumed`, `downtime`, `oee`
- IoT linkage: `telemetrySource`, `liveTelemetryEnabled`, `linkedDeviceId`, `lastLiveTelemetryAt`, `lastHeartbeat`
- AI fields: `aiPrediction`, `predictionHistory`, `aiIntelligence`, `aiHealthPercent`, `aiRiskPercent`, `aiFailureProbability`, `aiRemainingUsefulLifeHours`, `aiRootCauseSummary`, `aiAnomalySeverity`, `aiConfidencePercent`, `aiLastAnalyzedAt`
- Maintenance: `maintenanceHistory`

Indexes:

- unique `machineId`
- scope indexes for organization, plant, department, line, group, area, and asset
- `department + status`
- `organizationId + plantId + status`
- `plantId + criticality + lifecycleState`
- `health`
- `updatedAt`

## Data Ownership and Scoping

Tenant and plant scoping is enforced in middleware and service queries. Many records carry string IDs instead of MongoDB references to preserve compatibility with existing API payloads and demo/import workflows.

## Migration Notes

- No destructive migration is required for the current implementation.
- New fields are additive and have defaults.
- Existing machine, user, notification, work order, and telemetry data remains compatible.
- Before production import, normalize `machineId`, `deviceId`, tenant IDs, plant IDs, and user emails.

## Backup and Restore

Backup APIs export configuration and operational data. Restore requires a maintenance-window token. Keep `BACKUP_RESTORE_TOKEN` server-side only.
