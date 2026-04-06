# IMPLEMENTATION HANDOVER - PHASE 1 (STRUCTURE-FIRST)

## 1) Purpose

This handover is for the implementer who will write code for the ad-platform backend.
The goal of this phase is to complete project structure and route wiring only.
Do not add full business logic in this phase.

## 2) Current Baseline (Already Completed)

- Node.js + Express project initialized
- Prisma initialized and migrated to PostgreSQL
- Schema present in prisma/schema.prisma
- Express app entry exists in src/app.js
- Environment setup present (.env and .env.example)
- Documentation and checklist are in place

## 3) Scope for This Phase (In Scope)

Implement only the following:

1. Create placeholder route modules in src/API:
   - clients.route.js
   - tokens.route.js
   - accounts.route.js
   - campaigns.route.js
   - reports.route.js

2. Register all placeholder routes in src/app.js

3. Add endpoint:
   - GET /health

4. Optionally add endpoint:
   - GET /version

5. Add placeholder structure files (if not already present):
   - minimal starter files in src/Services
   - minimal starter files in src/Utils

6. Add architecture documentation files:
   - ROUTE_STRUCTURE.md
   - SERVICE_STRUCTURE.md
   - ENVIRONMENT.md
   - DATABASE_STRUCTURE.md

## 4) Out of Scope (Do Not Implement Yet)

- Real OAuth flow (Google/Meta)
- Real token encryption flow in production logic
- Campaign/ad/report sync jobs or schedulers
- Full CRUD business logic
- Authorization/permission systems
- Deployment pipeline

## 5) Folder and Naming Constraints

Current source folders are capitalized:
- src/API
- src/Services
- src/Utils
- src/Config

Use this naming style in this phase unless a formal rename task is approved.
Do not mix lowercase and uppercase folder conventions in new code.

## 6) Route Placeholder Contract

Each route file should:
- Export an Express router
- Include at least one basic placeholder handler
- Return explicit JSON indicating placeholder status

Example response style:
- status: "ok"
- module: "clients"
- message: "placeholder route"

Keep responses simple and consistent.

## 7) Acceptance Criteria (Definition of Done)

Phase is complete when all are true:

1. App starts without runtime errors.
2. Route modules exist for clients/tokens/accounts/campaigns/reports.
3. Route modules are imported and registered in src/app.js.
4. GET /health returns success JSON.
5. GET /version returns version metadata JSON (if implemented).
6. Documentation files exist and describe intended structure.
7. No business logic beyond placeholders has been added.

## 8) Validation Checklist for Implementer

Run and verify:

1. Start server:
   - npm start

2. Hit endpoints:
   - GET /
   - GET /health
   - GET /version (if added)
   - GET route bases used for placeholders

3. Confirm expected behavior:
   - All placeholder endpoints return JSON
   - No unhandled exceptions in terminal
   - App stays running

4. Confirm docs exist and are readable:
   - ROUTE_STRUCTURE.md
   - SERVICE_STRUCTURE.md
   - ENVIRONMENT.md
   - DATABASE_STRUCTURE.md

## 9) Deliverables to Hand Back

Implementer should provide:

1. List of created/updated files
2. Brief summary of route paths registered
3. Sample responses for /health and one placeholder route
4. Any blockers or assumptions

## 10) Notes for Next Phase

After this phase is accepted, next phase can begin:
- token utility implementation
- first real API logic in selected modules
- integration planning for OAuth and syncing
