# FRONTEND API CONTRACT

## Purpose

This document defines the current backend contract for website/frontend integration.
Use this as the source of truth when building the API client layer.

## Base Configuration

- Base URL (local): http://localhost:3000
- API prefix: /api
- Content type: application/json
- Auth headers: not required yet (full auth is not implemented)

## CORS

- Backend allows browser origins from CORS_ORIGINS.
- Configure in .env as comma-separated values.
- Default local values are used only when CORS_ORIGINS is not set.

Example:

CORS_ORIGINS="http://localhost:5173,http://localhost:3001,http://localhost:3000"

## Response Envelope

Implemented routes use a JSON envelope.

Success:
{
  "status": "ok",
  "module": "tokens",
  "message": "token fetched",
  "data": {}
}

Error:
{
  "status": "error",
  "message": "token not found"
}

## Global Endpoints

### GET /

- Purpose: backend root check
- Response: plain text

### GET /health

- Purpose: health check
- 200 response:
{
  "status": "ok",
  "service": "ad-platform",
  "message": "health check passed"
}

### GET /version

- Purpose: app version/environment metadata
- 200 response:
{
  "status": "ok",
  "name": "ad-platform",
  "version": "1.0.0",
  "environment": "development"
}

## Tokens API (Live)

### GET /api/tokens/

- Purpose: module info
- 200 response includes available token endpoints

### POST /api/tokens

- Purpose: create or update token by unique pair (clientId + platform)
- Body:
{
  "clientId": 1,
  "platform": "google",
  "accessToken": "abc123456789TOKEN",
  "refreshToken": "ref987654321TOKEN",
  "expiresAt": "2026-12-31T00:00:00.000Z"
}

Validation rules:
- clientId: positive integer
- platform: required, normalized to lowercase by backend
- accessToken: required string
- refreshToken: optional string or null
- expiresAt: optional valid datetime string

Success:
- Status: 200
- Response data includes masked token values

Error cases:
- 400: invalid payload
- 404: client not found
- 500: failed to save token

### GET /api/tokens/:clientId/:platform

- Purpose: fetch token by client/platform
- Path params:
  - clientId: positive integer
  - platform: required string

Success:
- Status: 200
- Response data includes masked token values

Error cases:
- 400: invalid path params
- 404: token not found
- 500: failed to fetch token

## Accounts API (Live)

### GET /api/accounts/

- Purpose: module info
- 200 response includes available account endpoints

### POST /api/accounts

- Purpose: create ad account
- Body:
{
  "clientId": 1,
  "platform": "google",
  "externalAccountId": "acct_001",
  "name": "Main Google Ads"
}

Validation rules:
- clientId: positive integer
- platform: required, normalized to lowercase by backend
- externalAccountId: required string
- name: optional string or null

Success:
- Status: 201
- Response data includes created account

Error cases:
- 400: invalid payload
- 404: client not found
- 500: failed to save account

### GET /api/accounts/:id

- Purpose: fetch account by numeric id
- Path params:
  - id: positive integer

Success:
- Status: 200
- Response data includes account object

Error cases:
- 400: invalid id
- 404: account not found
- 500: failed to fetch account

## Placeholder APIs (Not Ready)

Do not depend on these for production UI yet:
- /api/clients
- /api/campaigns
- /api/reports

These currently return placeholder payloads only.

## Frontend Error Mapping Contract

Map errors by both HTTP status and response message.

Recommended UI mapping:
- 400 -> form/input validation message
- 404 -> not found state for lookup views
- 500 -> generic retry/error boundary state

## Date and Time Contract

- Send datetimes as ISO-8601 UTC strings.
- Recommended format: YYYY-MM-DDTHH:mm:ss.sssZ
- Treat backend datetime values as UTC and localize only when rendering in UI.

## Suggested Frontend API Client Shape

Suggested function signatures:
- getHealth(): Promise<HealthResponse>
- getVersion(): Promise<VersionResponse>
- saveToken(payload: SaveTokenPayload): Promise<SaveTokenResponse>
- getToken(clientId: number, platform: string): Promise<GetTokenResponse>
- saveAccount(payload: SaveAccountPayload): Promise<SaveAccountResponse>
- getAccount(id: number): Promise<GetAccountResponse>

Shared behavior for all API client methods:
- parse JSON when available
- throw normalized error object with: status, message, raw
- include credentials if you rely on cookies later
