# Changelog

## 1.0.0 - 2026-07-24

### Release

- Prepared KAVACH as the first production `v1.0.0` release.
- Aligned root, frontend, and backend package metadata to `1.0.0`.
- Aligned environment examples and Render release metadata to `API_VERSION=1.0.0` and `APP_RELEASE=1.0.0`.
- Added the v1.0.0 release report and updated release documentation.
- Verified production readiness without deploying or pushing changes.

## 0.9.2 - 2026-07-24

### Added

- AI scenario simulator UI for machine failure, temperature increase, power spike, production slowdown, and downtime scenarios.
- Rich what-if simulation impact fields: affected machines, downtime, financial impact, operational impact, risk level, and recommended actions.
- Autonomous AI Control Center recommendations with Approve and Reject review controls. Actions are not executed automatically.
- Executive Digital War Room with live KPIs, plant overview, alert timeline, AI risk radar, and operational status.
- AI Incident Investigation report panel with timeline, root cause, affected assets, business impact, corrective actions, and prevention notes.
- Plant Efficiency Optimizer recommendations for energy, production efficiency, maintenance scheduling, and operating cost reduction.
- Professional app-level loading, 404, route error, and global 500 pages.
- Dedicated database schema, user manual, and developer guide documentation.

### Changed

- Expanded AI root cause analysis across predictive, dashboard AI insights, and machine detail pages.
- Added machine maintenance timeline and digital twin playback controls.
- Improved Copilot responses for plant-health, critical-machine, maintenance-priority, and production-decrease questions using live project data.
- Standardized runtime info logging for backend startup, MongoDB, and MQTT paths.
- Added explicit loading and empty states to Analytics and Reports.
- Updated project documentation to match the current implementation and live QA findings.

### Verification

- `npm run verify` passed.
- Frontend production audit reported zero vulnerabilities.
- Backend production audit reported zero vulnerabilities.
- Live deployed backend QA passed for health, auth invalid inputs, protected routes, authenticated API modules, Socket.IO polling, CORS preflight, exports, reports, and Copilot.
- `https://kavach-frontend-4s8e.onrender.com` route smoke passed.
- `https://kavach-frontend.onrender.com` returned `503` during QA and needs deployment-level review.

## 0.9.0 - 2026-07-23

### Added

- Interactive 3D Smart Factory Digital Twin with live machine status, sensor overlays, clickable equipment, alarm markers, and animated production flow.
- Smart Factory dashboard with protocol health, QR lookup, AI Vision event submission, camera dashboard, and event timeline.
- AI Vision support for PPE, fire, smoke, and intrusion event records.
- AI Vision safety alert creation through existing notification workflows.
- Predictive simulation and what-if analysis.
- PWA manifest, service worker shell caching, and browser push subscription storage.
- Automated executive report type, report automation status, and report delivery logs.
- Demo data for enterprise plants, machines, work orders, telemetry, predictive alerts, AI Vision cameras, and AI Vision events.
- Release architecture, screenshot checklist, and production release report documentation.

### Changed

- Updated README, API reference, installation guide, deployment guide, and environment examples for v4 production readiness.
- Dashboard Digital Twin card consumes live enterprise telemetry.
- `/plant` Digital Twin page surfaces production KPIs, alarms, and AI twin insights around the 3D scene.

### Compatibility

- Existing authentication, RBAC, API routes, ESP32 sensor ingestion, MQTT path, machine model, notification center, work orders, reports, and enterprise flows remain backward compatible.
