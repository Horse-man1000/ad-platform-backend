# Phase 9 Completion Rundown (From VSCode)

Date: 2026-04-06
Phase: 9 - Ad Reading Sync (read-only)
Status: Complete

## Objective

Implement read-only ad sync behavior for:
- GET /ads/sync?clientId=N

Using existing sync/OAuth patterns and Prisma data access, without schema changes.

## What Was Delivered

1. Query validation for `clientId`.
2. Client existence validation before sync work starts.
3. Local campaign loading (joined to local ad accounts) per client.
4. Per-platform sync execution with independent failure handling.
5. Idempotent ad upsert logic (safe to run repeatedly).
6. No ad auto-delete behavior.
7. No provider write calls.
8. Required summary response shape with both `google` and `meta` blocks.

## Files Implemented

- `src/API/ads/sync.route.js`
- `src/Services/ads-sync.service.js`
- `src/Services/google-ads.service.js`
- `src/Services/meta-ads.service.js`
- `src/app.js` (route registration only)

## Route Behavior

### GET /ads/sync?clientId=N

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
      "adsAdded": 10,
      "adsUpdated": 4
    },
    "meta": {
      "connected": true,
      "synced": false,
      "adsAdded": 0,
      "adsUpdated": 0,
      "reason": "PLATFORM_SYNC_FAILED"
    }
  }
}
```

## Service Logic Summary

### ads-sync.service.js

- Validates client existence.
- Detects connected platforms by checking `ClientToken` rows for `google` and `meta`.
- Loads local campaigns (with associated account platform/account external ID) for this client.
- For each connected platform:
  - Calls existing token refresh helper.
  - Calls platform ad sync service.
  - Fills `connected`, `synced`, `adsAdded`, `adsUpdated`.
- On refresh/provider failure:
  - Keeps `connected=true`
  - Sets `synced=false`
  - Adds `reason` code for deterministic diagnostics.

### google-ads.service.js

- Reads Google access token from DB.
- Calls Google Ads read endpoint (`googleAds:searchStream`) per local campaign/account.
- Reads ad metadata from provider response where available.
- Ensures a local `AdSet` exists (find/create) so an `Ad` can be attached.
- Upserts local `Ad` rows idempotently using `findFirst` + `update/create` by:
  - `adsetId`
  - `externalId`

### meta-ads.service.js

- Reads Meta access token from DB.
- Calls Meta Graph read endpoint per campaign:
  - `/{campaignId}/ads?fields=id,name,status,creative{id},adset{id,name}`
- Ensures a local `AdSet` exists (find/create) so an `Ad` can be attached.
- Upserts local `Ad` rows idempotently using `findFirst` + `update/create` by:
  - `adsetId`
  - `externalId`

## Constraints Confirmed

- No schema changes.
- No migrations.
- No provider write calls (read-only provider fetches only).
- No local ad auto-delete behavior.
- No unrelated features were added.

## Validation Performed

- Static diagnostics: no errors in new/updated Phase 9 files.
- Runtime endpoint checks:
  - Missing `clientId` returns `400`.
  - Unknown client returns `404`.
  - Known client with no connected platforms returns `200` with both platform blocks `connected=false`.
  - Known client with connected platform and provider/token issue returns `200` deterministic summary with platform `synced=false` and `reason`.

## Notes

- Some requested provider metadata (for example status/creative references) is not fully representable in current `Ad` schema.
- Per phase constraints, only supported schema fields are persisted safely.
- Persisting additional ad metadata directly would require a future schema phase.
