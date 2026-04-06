# Phase 9 Coder Handover (VSCode to VSCode)

Date: 2026-04-06
Phase: 9 - Ad Reading Sync (read-only)

## Source Instruction

Primary source:
- Instruction files/From Copilot/Phase 9 from copilot.txt

## Goal

Implement read-only ad sync for:
- GET /ads/sync?clientId=N

Use the same implementation patterns and safety conventions used in Phase 7 and Phase 8.

## Files To Add

- src/API/ads/sync.route.js
- src/Services/ads-sync.service.js
- src/Services/google-ads.service.js
- src/Services/meta-ads.service.js

## Route Registration

Register the new route in:
- src/app.js

Expected mount style (consistent with current sync routes):
- app.use("/ads/sync", adsSyncRouter)

## Existing Reusable References

- src/API/accounts/sync.route.js
- src/Services/accounts-sync.service.js
- src/API/campaigns/sync.route.js (if already present)
- src/Services/campaigns-sync.service.js (if already present)
- src/Services/google-sync.service.js
- src/Services/meta-sync.service.js
- src/Services/google-campaigns.service.js (if already present)
- src/Services/meta-campaigns.service.js (if already present)
- src/Services/OAuth/google.service.js
- src/Services/OAuth/meta.service.js
- src/Config/prisma.js
- prisma/schema.prisma

## Required Behavior

1. Validate clientId query parameter.
2. Validate that client exists.
3. Load ad accounts and campaigns from local DB.
4. For each campaign:
   - Google campaign -> fetch ads from Google Ads API
   - Meta campaign -> fetch ads from Meta Marketing API
5. Upsert ads idempotently.
6. Do not delete local ads automatically.
7. Do not call provider write endpoints.
8. Return a summary response.

## Required Error Handling

- Missing clientId -> 400
- Unknown client -> 404
- No connected platforms -> 200 with synced=false
- Per-platform failure should not crash the whole request

## Data Fields To Persist (Read-Only Metadata)

Persist minimal ad metadata where available:
- externalAdId
- name (or descriptive field)
- type
- status
- creativeId (Meta only reference)

## Important Schema Constraints

This phase forbids schema changes and migrations.
If current schema does not support all requested fields directly:
- persist only fields already represented in schema
- keep mapping logic safe and explicit
- do not introduce migrations in this phase

For idempotency, if composite unique keys are not available for desired external IDs:
- use findFirst + update/create, or
- use transaction-backed equivalent logic

## Strict Do-Not List

Do not:
- add campaign creation logic
- add ad creation logic on provider APIs
- write to provider APIs
- change schema
- add migrations
- add unrelated features

## Suggested Summary Response Pattern

Keep consistent with existing sync-style responses:

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

## Reviewer QA Checklist

1. Start server and confirm app boots cleanly.
2. Call GET /ads/sync?clientId=<validId>.
3. Verify response includes per-platform sync blocks.
4. Re-run sync and confirm no duplicate ad rows are created.
5. Confirm metadata changes update existing local rows.
6. Confirm no-token/no-platform cases return safe 200 summary with synced=false.
7. Confirm per-platform failure does not fail entire response.
8. Confirm no schema/migration files changed.

## Definition of Done

- Ad sync endpoint works for valid client.
- Reads accounts/campaigns from DB and reads ad data from provider APIs.
- Local persistence is idempotent.
- No auto-delete behavior.
- No provider write calls.
- No schema/migration changes.
