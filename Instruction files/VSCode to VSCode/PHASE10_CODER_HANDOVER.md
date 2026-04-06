# Phase 10 Coder Handover (VSCode to VSCode)

Date: 2026-04-06
Phase: 10 - Metrics & Reporting Sync (per-ad, daily)

## Source Instruction

Primary source:
- Instruction files/From Copilot/phase 10 from copilot.txt

## Goal

Implement read-only metrics sync for:
- GET /metrics/sync?clientId=N&from=YYYY-MM-DD&to=YYYY-MM-DD

This phase adds daily per-ad metrics persistence with idempotent upsert behavior.

## Required Schema Change (Only One Allowed)

Add new Prisma model: AdMetric

Expected conceptual fields:
- id
- adId (FK -> Ad)
- date (day granularity)
- impressions (int)
- clicks (int)
- spend (decimal)
- platform (google/meta)
- createdAt/updatedAt (optional standard timestamps)

Required constraints:
- unique(adId, date)
- idempotent upserts only
- no automatic deletes

Then:
1. create Prisma migration
2. apply migration

No other schema changes are allowed in this phase.

## Files To Add

- src/API/metrics/sync.route.js
- src/Services/metrics-sync.service.js
- src/Services/google-metrics.service.js
- src/Services/meta-metrics.service.js

## Route Registration

Register in:
- src/app.js

Expected mount style:
- app.use("/metrics/sync", metricsSyncRouter)

## Existing Reusable References

- src/API/accounts/sync.route.js
- src/Services/accounts-sync.service.js
- src/API/campaigns/sync.route.js (if present)
- src/Services/campaigns-sync.service.js (if present)
- src/API/ads/sync.route.js (if present)
- src/Services/ads-sync.service.js (if present)
- src/Services/OAuth/google.service.js
- src/Services/OAuth/meta.service.js
- src/Config/prisma.js
- src/Utils/error-codes.js (if present)
- prisma/schema.prisma

## Required Behavior

1. Validate query params:
   - clientId
   - from (YYYY-MM-DD)
   - to (YYYY-MM-DD)
2. Validate client exists.
3. Load client ads from DB.
4. For each connected platform:
   - refresh token if needed
   - fetch daily metrics per ad for date range
   - upsert AdMetric records idempotently
5. Partial platform failure must not fail whole request.
6. Return deterministic summary response.
7. Never delete metrics automatically.

## Error Handling Requirements

- Missing/invalid clientId -> 400
- Missing/invalid date params -> 400
- Unknown client -> 404
- No connected platforms or no ads -> 200 with synced=false-style summary
- Platform failures should be isolated to platform block, not whole response

Use existing error-code and response conventions already in the codebase.
Do not expose raw provider responses in API outputs.

## Read-Only Constraints

Do not:
- call provider write endpoints
- add campaign/ad creation logic
- add background jobs
- add unrelated features
- change schema beyond AdMetric

## Suggested Response Shape

Keep consistent with prior sync responses:

```json
{
  "status": "ok",
  "clientId": 123,
  "range": {
    "from": "2026-04-01",
    "to": "2026-04-06"
  },
  "platforms": {
    "google": {
      "connected": true,
      "synced": true,
      "metricsAdded": 42,
      "metricsUpdated": 10
    },
    "meta": {
      "connected": true,
      "synced": false,
      "metricsAdded": 0,
      "metricsUpdated": 0,
      "reason": "PLATFORM_SYNC_FAILED"
    }
  }
}
```

## Reviewer QA Checklist

1. Run Prisma migration and confirm AdMetric table exists.
2. Start server and confirm app boots cleanly.
3. Call GET /metrics/sync?clientId=<id>&from=<date>&to=<date>.
4. Verify deterministic per-platform summary response.
5. Re-run same range and verify no duplicate AdMetric rows.
6. Confirm changed daily values update existing rows.
7. Confirm invalid params return 400.
8. Confirm unknown client returns 404.
9. Confirm partial platform failure does not fail entire request.
10. Confirm no schema changes besides AdMetric model and its migration.

## Definition of Done

- AdMetric model exists with unique(adId, date).
- Migration created and applied.
- Metrics sync endpoint works for valid client/date range.
- Per-platform sync is read-only toward providers.
- Local persistence is idempotent.
- No forbidden scope expansion introduced.
