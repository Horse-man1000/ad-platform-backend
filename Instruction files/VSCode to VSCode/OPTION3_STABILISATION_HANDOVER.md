# Option 3 Coder Handover (VSCode to VSCode)

Date: 2026-04-06
Scope: Stabilisation & Polish after Phase 8

## Source Instruction

Primary source:
- Instruction files/From Copilot/Option 3 Stabilisation after phase 8.txt

## Objective

Improve maintainability, observability, and consistency of the existing backend
without changing functionality or expanding scope.

## In-Scope Tasks

### 1) Lightweight Logging

Add simple logs around sync execution for:
- /accounts/sync
- /campaigns/sync

Logs must include:
- clientId
- platform (google/meta when applicable)
- success/failure
- counts added/updated

Logs must not include:
- OAuth tokens
- secrets
- raw provider responses

### 2) Centralised Error Codes

Create a shared error-code source, e.g.:
- src/Utils/error-codes.js

Refactor repeated error-code strings to use this shared source.
Keep behavior the same (no change in response outcomes).

### 3) Response Consistency Check

Ensure sync endpoints consistently return:
- status
- clientId
- per-platform blocks

Ensure error responses consistently:
- use status: "error"
- provide human-readable messages
- do not expose raw provider/internal errors

### 4) Basic Sanity Validation (Manual)

Verify:
- missing clientId -> 400
- unknown client -> 404
- known client with no tokens -> 200 with connected=false
- known client with tokens -> 200 deterministic summary

### 5) System Overview Document

Create:
- SYSTEM_OVERVIEW.md

Include concise sections:
- what the backend does
- what it explicitly does not do (no campaign creation)
- high-level flow: OAuth -> Accounts -> Campaigns
- how to trigger sync endpoints
- example normal response shapes

## Strict Do-Not List

Do not:
- add new endpoints
- add provider write calls
- add campaign creation logic
- change schema
- add migrations
- add background jobs
- add deployment logic
- add performance optimization beyond requested logging polish

## Recommended Files To Touch

Likely candidates:
- src/API/accounts/sync.route.js
- src/API/campaigns/sync.route.js
- src/Services/accounts-sync.service.js
- src/Services/campaigns-sync.service.js
- src/Services/google-sync.service.js
- src/Services/meta-sync.service.js
- src/Services/google-campaigns.service.js
- src/Services/meta-campaigns.service.js
- src/Utils/error-codes.js (new)
- SYSTEM_OVERVIEW.md (new)

Only touch what is necessary to satisfy Option 3.

## Definition of Done

Option 3 is complete when:
1. Logging exists for accounts/campaigns sync start and finish.
2. Error codes are centralised without behavior change.
3. Sync responses and error envelopes are consistent.
4. Manual sanity checks pass for key scenarios.
5. SYSTEM_OVERVIEW.md exists and is readable.
6. No scope expansion was introduced.

## Completion Report Required From Coder

When done, provide:
1. List of touched files
2. Confirmation that functionality did not change
3. Confirmation no new features/endpoints/schema/migrations were added
4. Brief summary of sanity-check results
