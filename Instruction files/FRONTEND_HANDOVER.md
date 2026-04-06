# FRONTEND HANDOVER

## Purpose

This file is for the person building the frontend.
It explains what backend features are ready now, what is still placeholder, and how to integrate safely.

API details for website integration are in:
- FRONTEND_API_CONTRACT.md

## Current Stage

Backend is in early-to-mid implementation.

Completed:
- Core Express server setup
- Prisma + PostgreSQL connection
- Health and version endpoints
- Real Tokens module (save + fetch)
- Real Accounts module (save + fetch)

Not completed yet:
- Real Clients business logic
- Real Campaigns business logic
- Real Reports business logic
- OAuth flows (Google/Meta)
- Background sync jobs
- Full auth/permissions system

## Run Backend Locally

From project root:

```bash
npm install
npm.cmd start
```

Base URL:
- http://localhost:3000

## Website Integration Notes (Important)

- CORS is enabled in backend via `src/app.js`.
- Allowed origins are read from `CORS_ORIGINS` (comma-separated env variable).
- If `CORS_ORIGINS` is not set, backend uses local development defaults:
  - `http://localhost:5173`
  - `http://localhost:3001`
  - `http://localhost:3000`
- If your frontend runs on a different origin, add it to `CORS_ORIGINS` before testing in browser.

## Endpoints Available Now

### Global

1. GET /
- Response: plain text

2. GET /health
- Response example:
```json
{
  "status": "ok",
  "service": "ad-platform",
  "message": "health check passed"
}
```

3. GET /version
- Response example:
```json
{
  "status": "ok",
  "name": "ad-platform",
  "version": "1.0.0",
  "environment": "development"
}
```

### Tokens (Implemented)

1. GET /api/tokens/
- Module info endpoint

2. POST /api/tokens
- Saves or updates token by unique key: (clientId + platform)
- Request body:
```json
{
  "clientId": 1,
  "platform": "google",
  "accessToken": "abc123456789TOKEN",
  "refreshToken": "ref987654321TOKEN",
  "expiresAt": "2026-12-31T00:00:00.000Z"
}
```
- Success response (token values are masked):
```json
{
  "status": "ok",
  "module": "tokens",
  "message": "token saved",
  "data": {
    "id": 1,
    "clientId": 1,
    "platform": "google",
    "accessToken": "abc1...OKEN",
    "refreshToken": "ref9...OKEN",
    "expiresAt": "2026-12-31T00:00:00.000Z",
    "updatedAt": "2026-03-29T22:22:12.531Z"
  }
}
```

3. GET /api/tokens/:clientId/:platform
- Fetches token record
- Example: GET /api/tokens/1/google

### Accounts (Implemented)

1. GET /api/accounts/
- Module info endpoint

2. POST /api/accounts
- Creates account
- Request body:
```json
{
  "clientId": 1,
  "platform": "google",
  "externalAccountId": "acct_001",
  "name": "Main Google Ads"
}
```
- Success response:
```json
{
  "status": "ok",
  "module": "accounts",
  "message": "account saved",
  "data": {
    "id": 1,
    "clientId": 1,
    "platform": "google",
    "externalAccountId": "acct_001",
    "name": "Main Google Ads",
    "createdAt": "2026-03-29T22:37:56.470Z"
  }
}
```

3. GET /api/accounts/:id
- Fetches account by numeric id
- Example: GET /api/accounts/1

## Placeholder Endpoints (Do Not Depend On Yet)

- /api/clients
- /api/campaigns
- /api/reports

These routes currently return placeholder responses only.

## Frontend Integration Guidance

Build now:
- App shell and routing
- Health/version status widget
- Token form (save + view)
- Account form (save + view)
- API client layer (fetch wrapper, error mapping)

Use temporary mocks for:
- Clients pages
- Campaigns pages
- Reports pages
- OAuth connect flows

## Expected Error Cases

The implemented routes return standard JSON errors with HTTP status codes:
- 400 for bad input
- 404 for not found
- 500 for server failure

Examples from current implemented routes:

400 Bad Request
```json
{
  "status": "error",
  "message": "clientId must be a positive integer"
}
```

404 Not Found
```json
{
  "status": "error",
  "message": "token not found"
}
```

500 Server Error
```json
{
  "status": "error",
  "message": "failed to save account"
}
```

Frontend should map errors by both status code and `message`.

## Date/Time Handling

- `expiresAt` must be a valid datetime string when provided.
- Send ISO-8601 UTC strings from frontend, for example: `2026-12-31T00:00:00.000Z`.
- Backend stores and returns datetime values in standard JSON datetime format; treat them as UTC in UI and format for local display only at render time.

## Suggested Frontend Build Order

1. Create API service module with base URL and JSON parser
2. Add Health + Version page section
3. Add Tokens form and token lookup view
4. Add Accounts form and account lookup view
5. Scaffold Clients/Campaigns/Reports pages with mock data

## Key Backend Files

- src/app.js
- src/API/tokens.route.js
- src/API/accounts.route.js
- src/Services/tokens.service.js
- src/Services/accounts.service.js
- src/Config/prisma.js
- prisma/schema.prisma

## Notes

- Platform values are normalized to lowercase in backend routes.
- Token values are intentionally masked in API responses.
- Keep UI labels user-friendly even if backend fields use technical names.
