# Phase 7 Completion Rundown (From VSCode)

Date: 2026-04-06
Phase: 7 - Real Account Sync Logic
Status: Complete

## Objective

Implement real sync behavior for:
- GET /accounts/sync?clientId=N

Using existing OAuth/token helpers and Prisma data access, without schema changes.

## What Was Delivered

1. Query validation for `clientId`.
2. Platform connection detection (Google and Meta) based on existing client tokens.
3. Per-platform sync execution with independent failure handling.
4. Idempotent account upsert logic (safe to run repeatedly).
5. No account auto-delete behavior.
6. Required summary response shape with both `google` and `meta` blocks.

## Files Implemented

- `src/API/accounts/sync.route.js`
- `src/Services/accounts-sync.service.js`
- `src/Services/google-sync.service.js`
- `src/Services/meta-sync.service.js`

## Route Behavior

### GET /accounts/sync?clientId=N

- Returns `400` if `clientId` is missing/invalid.
- Returns `404` if client does not exist.
- Returns `200` with deterministic summary object when request is valid.

Response structure:

```json
{
  "status": "ok",
  "clientId": 123,
  "platforms": {
    "google": {
      "connected": true,
      "synced": true,
      "accountsAdded": 2,
      "accountsUpdated": 1
    },
    "meta": {
      "connected": false,
      "synced": false,
      "accountsAdded": 0,
      "accountsUpdated": 0
    }
  }
}
```

## Service Logic Summary

### accounts-sync.service.js

- Validates client existence.
- Detects connected platforms by reading `ClientToken` rows for `google` and `meta`.
- For each connected platform:
  - Calls existing token refresh helper.
  - Calls platform sync service.
  - Fills `connected`, `synced`, `accountsAdded`, `accountsUpdated`.
- On refresh or provider failure:
  - Keeps `connected=true`
  - Sets `synced=false`
  - Adds `reason` code for deterministic diagnostics.

### google-sync.service.js

- Reads Google access token from DB.
- Calls Google Ads API to list accessible customers.
- Fetches account metadata per customer (id, name, currency, timezone, status).
- Upserts `AdAccount` idempotently using `findFirst` + `update/create` by:
  - `clientId`
  - `platform`
  - `externalAccountId`

### meta-sync.service.js

- Reads Meta access token from DB.
- Calls Graph API `/me/adaccounts`.
- Requests metadata fields: `id,name,currency,timezone_name,account_status`.
- Upserts `AdAccount` idempotently using `findFirst` + `update/create` by:
  - `clientId`
  - `platform`
  - `externalAccountId`

## Constraints Confirmed

- No schema changes.
- No migrations.
- No campaign sync in this phase.
- No frontend assumptions.
- No auto-delete account behavior.

## Validation Performed

- Static diagnostics: no errors in updated Phase 7 files.
- Runtime endpoint checks:
  - Missing `clientId` returns `400`.
  - Unknown client returns `404`.
  - Valid seeded client returns `200` and required response shape.

## Notes

- Current `AdAccount` schema stores `name` but not `currency/timezone/status`.
- Metadata is fetched during sync as required; only persistable fields are written.
- Persisting additional metadata would require a future schema phase.
