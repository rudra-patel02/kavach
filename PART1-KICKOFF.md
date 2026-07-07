# Part 1 — Kickoff Prompt

Paste the message below into a **fresh Claude Code session opened in this repo** to begin the rebuild. It assumes `CLAUDE.md` and `build-spec.md` are in the repo root.

---

> You are working in the KAVACH repo. Read `CLAUDE.md` and `build-spec.md` in the root — they are the source of truth. We are executing the rebuild **one part at a time, test-first**, starting with **Part 1 — Foundation, Secrets & Auth/Roles**.
>
> Before writing any code:
> 1. Enter **plan mode** and propose a plan for Part 1 only. Do not touch Parts 2–6.
> 2. In the plan, list: (a) exactly which out-of-scope routes/pages/services you will delete (cross-check against the "OUT OF SCOPE" and route list), (b) the auth changes (login/refresh/logout, server-owned role map, role middleware, pinned HS256, `NODE_ENV=production` error handling), (c) the secret-hygiene steps (untrack `backend/.env`, load all secrets from env, remove placeholder-secret boot paths), and (d) the exact test files you will write first.
> 3. Wait for my approval of the plan.
>
> Then, once approved:
> - Write the **"Tests to write first"** from Part 1 of `build-spec.md` and confirm they fail for the right reason.
> - Implement until those tests pass and the **full suite** (backend `node --test` + frontend Vitest) is green. Do not break any existing passing test; if a test must change, change it deliberately and explain why.
> - Do **not** start Part 2.
>
> Part 1 is done when its **Definition of done** in `build-spec.md` is fully met. At that point: make one focused commit for Part 1, tick the Part 1 checkbox in the `CLAUDE.md` Feature registry, and stop so I can `/clear` before Part 2.
>
> Hard rules for every part (from `CLAUDE.md`): no secrets in git; never accept `role`/`permissions`/`tenantId` from a request body; no hardcoded URLs; no fake numbers in the UI; escape user input before `RegExp`; scope every list query to the caller.

---

## Why these three files
- **CLAUDE.md** — the always-loaded operating manual (stack, conventions, hard rules, workflow, registry).
- **build-spec.md** — the single source of truth for *what* to build, in 6 sequenced, independently buildable parts.
- **PART1-KICKOFF.md** — this file; the exact prompt to start Part 1 cleanly in a fresh session.

## After Part 1
For each subsequent part, start a fresh session and paste the same prompt with the part name swapped (e.g. "starting with **Part 2 — Telemetry Ingest, Health & Alerts**"), then plan → approve → tests-first → implement → commit → tick registry → `/clear`.
