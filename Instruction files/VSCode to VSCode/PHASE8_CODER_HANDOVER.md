# Phase 8 Coder Handover (VSCode to VSCode)

Date: 2026-04-06
Phase: 8 - Campaign Reading Sync (read-only)

## Source Instruction

Primary source:
- Instruction files/From Copilot/Phase 8 from copilot.txt

## Goal

Implement read-only campaign sync for:
- GET /campaigns/sync?clientId=N

This should follow the same implementation pattern already used in Phase 7 account sync.

## Files To Add

- src/API/campaigns/sync.route.js
- src/Services/campaigns-sync.service.js
- src/Services/google-campaigns.service.js
- src/Services/meta-campaigns.service.js

## Existing Reusable References

- src/API/accounts/sync.route.js
- src/Services/accounts-sync.service.js
- src/Services/google-sync.service.js
- src/Services/meta-sync.service.js
- src/Services/OAuth/google.service.js
- src/Services/OAuth/meta.service.js
- src/Config/prisma.js
- prisma/schema.prisma
- src/app.js

## Required Behavior

1. Validate clientId query parameter.
2. Confirm client exists.
3. Load client ad accounts from DB.
4. For each account:
   - Google account -> fetch campaigns from Google Ads API
   - Meta account -> fetch campaigns from Meta Marketing API
5. Upsert campaigns idempotently.
6. Never auto-delete campaigns.
7. Return summary response.

## Important Schema Constraints

### Constraint 1: No composite unique key for Campaign upsert

Current schema does not define a composite unique key on:
- (accountId, externalCampaignId)

Therefore, implement idempotency using:
- findFirst + update/create, or
- transaction-backed equivalent

Do not add schema changes or migrations.

### Constraint 2: Requested provider fields exceed current schema

Phase 8 requests these fields where available:
- externalCampaignId
- name
- status
- type/objective

Current Campaign model only safely supports persisted fields already in schema.
If type/objective are not represented in schema, do not change schema in this phase.
Persist only what existing schema supports.

## Suggested Response Shape

Mirror Phase 7 account sync style for consistency:

```json
{
  "status": "ok",
  "clientId": 123,
  "platforms": {
    "google": {
      "connected": true,
      "synced": true,
      "campaignsAdded": 4,
      "campaignsUpdated": 2
    },
    "meta": {
      "connected": true,
      "synced": true,
      "campaignsAdded": 1,
      "campaignsUpdated": 0
    }
  }
}
```

## Implementation Notes

- Reuse token refresh/provider-access patterns from Phase 7.
- Read ad accounts from local DB first.
- Do not assume every client has both platforms connected.
- Handle platform-specific failures cleanly.
- Keep implementation read-only toward providers.

## Strict Do-Not List

- No schema changes
- No migrations
- No campaign creation on provider APIs
- No campaign modification on provider APIs
- No auto-delete of local campaigns
- No frontend assumptions

## Reviewer QA Checklist

1. Start server and confirm src/app.js boots cleanly.
2. Call GET /campaigns/sync?clientId=<validId>.
3. Verify response includes google/meta platform blocks.
4. Re-run sync and confirm no duplicate Campaign rows appear.
5. Verify changed campaign metadata updates existing local rows.
6. Verify missing-token or no-account scenarios fail cleanly.
7. Confirm no schema or migration files changed.

## Definition of Done

- Campaign sync endpoint works for a valid client.
- Campaigns are synced read-only from provider APIs.
- Local persistence is idempotent.
- No deletions occur automatically.
- No forbidden schema/migration/provider-write changes are introduced.
