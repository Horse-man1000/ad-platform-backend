# Phase 7 Coder Handover (VSCode to VSCode)

Date: 2026-04-06
Phase: 7 - Real Account Sync Logic

## Source Instruction

Primary source:
- Instruction files/From Copilot/Phase 7 from Copilot.txt

## Goal

Implement real sync logic for:
- GET /accounts/sync?clientId=N

Phase 6 placeholders are already in place.
OAuth/token helpers are already implemented.

## Required Behavior

1. Validate clientId query parameter.
2. Detect connected platforms (google/meta) for the client.
3. Sync each connected platform.
4. Upsert accounts idempotently (safe on repeated calls).
5. Never auto-delete accounts.
6. Return summary response in required shape.

Required response shape:

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

## Files To Implement

- src/API/accounts/sync.route.js
- src/Services/accounts-sync.service.js
- src/Services/google-sync.service.js
- src/Services/meta-sync.service.js

## Existing Reusable Files

- src/Services/OAuth/google.service.js
- src/Services/OAuth/meta.service.js
- src/Config/prisma.js
- prisma/schema.prisma

## Critical Constraint

Current schema does not define a composite unique key for:
- (clientId, platform, externalAccountId) in AdAccount

Because of this, implement idempotency using:
- findFirst + update/create, or
- transaction-backed equivalent

Do not change schema or create migrations in this phase.

## Error Handling Requirements

- No token for platform -> connected=false
- Token refresh fails -> synced=false
- Platform sync fails -> synced=false with reason

Keep responses clean and deterministic.

## Strict Do-Not List

- No schema changes
- No migrations
- No campaign syncing
- No frontend assumptions
- No auto-deletes of accounts

## Reviewer QA Checklist

1. Call GET /accounts/sync?clientId=<validId>
2. Verify response includes both google and meta blocks.
3. Re-run sync and confirm no duplicate AdAccount rows.
4. Verify updates are counted in accountsUpdated when metadata changes.
5. Verify missing-token path sets connected=false.
6. Verify platform failure path sets synced=false.
7. Confirm no schema or migration files changed.

## Definition of Done

- Real sync logic works for connected platforms.
- Idempotency behavior validated.
- Required response shape returned.
- No forbidden changes introduced.
