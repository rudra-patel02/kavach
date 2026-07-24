# KAVACH v1.0.0 Screenshot Checklist

Use this checklist for production release screenshots. Store captures in `docs/screenshots/` if you keep binary assets in the release package.

Recommended captures:

| File | Screen | Acceptance Notes |
| --- | --- | --- |
| `01-dashboard.png` | Main dashboard | KPIs, live alerts, charts, and digital twin card visible |
| `02-digital-twin.png` | `/plant` | 3D scene, sensor overlays, production flow, alarm markers |
| `03-machine-detail.png` | Digital Twin drawer or `/machines/:id` | Machine telemetry, AI risk, work orders, actions |
| `04-smart-factory.png` | `/smart-factory` | Protocol health, QR lookup, AI Vision cards |
| `05-ai-vision.png` | Smart Factory AI Vision area | Camera dashboard and event timeline visible |
| `06-predictive.png` | `/predictive` | RUL, failure probability, what-if simulation |
| `07-workorders.png` | `/workorders` | Work order queue and statuses |
| `08-reports.png` | `/reports` | Automated executive report option and export controls |
| `09-pwa-install.png` | Browser install prompt | App manifest detected, install available |

Quality bar:

- Capture desktop at 1440px width and mobile at 390px width.
- No overlapping text or clipped controls.
- No browser console errors.
- Use production or production-like seed data.
- Do not include real customer secrets, tokens, emails, or internal URLs.
