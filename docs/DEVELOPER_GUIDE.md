# Developer Guide

This guide explains how to work on KAVACH safely.

## Prerequisites

- Node.js 22.x
- npm 10+
- MongoDB Atlas or compatible MongoDB
- PowerShell, Bash, or equivalent shell

## Install

From the repository root:

```bash
npm install
```

The root `postinstall` script installs frontend and backend dependencies.

## Environment Files

Use:

- `.env.example` for combined production reference
- `backend/.env.example` for backend variables
- `frontend/.env.example` for frontend variables

Do not commit real `.env` values.

## Running Locally

Backend:

```bash
npm run backend:dev
```

Frontend:

```bash
npm run frontend:dev
```

Production-style local checks:

```bash
npm run frontend:build
npm run frontend:start
```

## Verification

Before handing off changes:

```bash
npm run verify
```

Before production release:

```bash
npm run verify:production
```

Current repository scripts:

- `frontend:lint`
- `frontend:typecheck`
- `frontend:build`
- `backend:test`
- `frontend:audit`
- `backend:audit`

There is no dedicated frontend unit-test script in the current implementation.

## Coding Rules

- Preserve existing architecture and route contracts.
- Prefer existing services and helpers over new abstractions.
- Keep API changes backward compatible.
- Keep database changes additive unless a migration is explicitly planned.
- Use TypeScript types from `frontend/types`.
- Use `frontend/lib/*` API clients rather than ad hoc fetches.
- Use existing backend controller/service/model separation.
- Keep operational actions human-approved unless the feature explicitly requires automation.

## Frontend Patterns

API calls:

- Use `fetchJson`, `authenticatedFetch`, or feature clients in `frontend/lib`.
- Prefer same-origin `/api` paths.
- Keep `NEXT_PUBLIC_API_URL` blank when using the Next proxy.

Realtime:

- Use `frontend/lib/socket.js`.
- Subscribe and clean up handlers in `useEffect`.
- Use existing event constants from `SOCKET_EVENTS`.

UI:

- Use existing dashboard/card/tile classes.
- Include loading, empty, and error states.
- Use accessible labels for form controls.
- Keep dark theme compatibility.

## Backend Patterns

Routes live in `backend/src/routes`.

Controllers live in `backend/src/controllers`.

Services live in `backend/src/services`.

Models live in `backend/src/models`.

Middleware handles:

- auth
- RBAC
- tenant scope
- security headers
- rate limiting
- request metrics
- error responses

## Adding API Behavior

1. Add or update a service function.
2. Add controller validation and response handling.
3. Wire the route with auth and role middleware.
4. Update frontend client types and API wrapper.
5. Add or update backend tests.
6. Update `API.md` and any user-facing docs.

## AI and Prediction Development

Prediction logic is centralized in `backend/src/services/predictionService.js`.

Scenario simulation is built in `backend/src/services/smartFactoryService.js`.

Copilot plant-context behavior is in `backend/src/services/aiCopilotService.js`.

Use live project data already available to these services. Do not introduce external AI dependency requirements unless the deployment environment is updated.

## IoT Development

Relevant backend areas:

- `backend/src/routes/iotRoutes.js`
- `backend/src/controllers/iotController.js`
- `backend/src/iot`
- `backend/src/services/SensorService.js`

Device writes must use device authentication when `DEVICE_SECRET` is configured.

## Release Checklist

1. Run `npm run verify`.
2. Run `npm run verify:production`.
3. Confirm backend `/api/health`.
4. Confirm frontend route smoke.
5. Confirm login and protected API access.
6. Confirm Socket.IO polling or websocket handshake.
7. Update `CHANGELOG.md`.
8. Update docs if routes, environment variables, user flows, or data shapes changed.

## Known Operational Notes

- Backend startup requires MongoDB connectivity. If Atlas rejects the current IP, Express will not bind.
- The healthy frontend deployment observed during QA was `https://kavach-frontend-4s8e.onrender.com`.
- The primary frontend alias `https://kavach-frontend.onrender.com` returned `503` during QA and should be checked in Render.
