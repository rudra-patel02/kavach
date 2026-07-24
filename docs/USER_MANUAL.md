# User Manual

This guide describes how operators, engineers, managers, and administrators use KAVACH.

## Login

1. Open the frontend URL.
2. Enter email and password.
3. KAVACH redirects authenticated users to the dashboard.

If login fails, verify credentials and wait if rate limiting was triggered by repeated failures.

## Dashboard

The dashboard is the main plant command surface.

Use it to:

- Review live plant KPIs and machine status.
- Watch live sensor readings.
- Review AI command-center metrics and recommended actions.
- Open AI Copilot.
- Monitor production analytics, alerts, and digital twin preview.

The Autonomous AI Control Center shows AI-recommended actions with Approve and Reject controls. These controls record review intent in the UI only; KAVACH does not execute machine actions automatically.

## Executive Dashboard

The executive dashboard provides:

- OEE, availability, health, energy, risk, downtime, and alert KPIs
- Department performance
- Top-risk machine list
- AI recommendations
- AI PDF report shortcuts
- Executive Digital War Room

Use the War Room during live review meetings or incidents. It presents live KPIs, plant overview, alert timeline, risk radar, and operational status.

## Machines

The Machines page lists registered assets. Machine detail pages show:

- Live status and telemetry
- AI analysis
- Root cause analysis
- Business impact
- Recommended action
- Maintenance priority
- Maintenance timeline with previous alerts, failures, maintenance history, upcoming maintenance, and predicted next service

## Predictive Maintenance

Use Predictive Maintenance to review:

- Failure probability
- Remaining useful life
- AI confidence
- Machine ranking
- Maintenance calendar
- AI recommendations
- Scenario simulation
- Incident investigation
- Plant efficiency optimization

### Scenario Simulator

1. Select a machine.
2. Select a scenario: machine failure, temperature increase, power spike, production slowdown, or downtime.
3. Adjust temperature, vibration, and power sliders.
4. Run the simulation.
5. Review operational impact, affected machine, downtime, financial impact, risk level, and recommended actions.

The simulator does not persist machine data.

### Incident Investigation

The incident panel generates an investigation summary for the highest-risk machine using current predictive data. It includes event timeline, root cause, affected assets, business impact, corrective actions, and prevention notes.

### Efficiency Optimizer

The optimizer recommends actions to reduce energy usage, improve production efficiency, optimize maintenance scheduling, and lower operating costs.

## Digital Twin and Plant

Digital Twin views show live machine state in a 3D factory scene. Users can:

- Inspect machine state visually.
- Select machines.
- Review alarms and live telemetry overlays.
- Use playback controls for recent windows: 15 minutes, 1 hour, and 24 hours.

Playback is a replay visualization and does not modify backend data.

## IoT

The IoT module shows device and telemetry state:

- Device overview
- Online/offline state
- Latest sensor readings
- Telemetry history
- Device command path where enabled

ESP32 or edge devices should use the backend IoT endpoints with `DEVICE_SECRET`.

## Smart Factory

Smart Factory includes:

- Protocol readiness for MQTT, OPC UA, Modbus, PLC, REST
- Digital twin state
- AI Vision camera dashboard
- AI Vision event timeline
- QR/machine lookup
- Vision event submission

AI Vision events include PPE, fire, smoke, and intrusion detections. High-severity events can appear in notifications.

## AI Modules

AI pages include:

- AI overview
- Fleet health
- Root cause
- Executive insights
- Failure forecast
- Machine intelligence
- Maintenance planner

These views use current project data and deterministic backend services.

## AI Copilot

Copilot answers plant-context questions such as:

- Which machine is most critical?
- Why did production decrease?
- Which machine needs maintenance first?
- Summarize current plant health.

Copilot also generates maintenance-style reports.

## Analytics

Analytics provides performance charts, machine heatmaps, KPIs, AI insights, and CSV export.

## Reports

Reports support catalog-based exports in PDF, Excel-compatible, or CSV formats, depending on report type.

## Alerts and Notifications

Users can:

- View alerts
- Mark notifications read
- Archive or delete notifications
- Manage preferences
- Validate desktop and push notification support when configured

## Audit

Audit logs show security and operational events. Authorized users can search and export audit records.

## Settings

Settings support profile, password, and preference management.

## System and Backup

System pages expose authenticated diagnostics and backup export/configuration controls for authorized users.

## Recommended Operating Practices

- Review critical alerts before shift handover.
- Use scenario simulation before planned production changes.
- Treat AI recommendations as decision support, not automatic commands.
- Confirm physical conditions before maintenance action.
- Rotate seeded admin credentials before production use.
