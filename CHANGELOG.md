# Changelog

## 4.0.0 - 2026-07-23

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

- Updated README, API reference, installation guide, deployment guide, and environment examples for v4.0 production readiness.
- Dashboard Digital Twin card now consumes live enterprise telemetry.
- `/plant` Digital Twin page now surfaces production KPIs, alarms, and AI twin insights around the 3D scene.

### Compatibility

- Existing authentication, RBAC, API routes, ESP32 sensor ingestion, MQTT path, machine model, notification center, work orders, reports, and enterprise flows remain backward compatible.
- New v4 functionality is additive.

### Verification

- `npm run verify` is the required release gate.
