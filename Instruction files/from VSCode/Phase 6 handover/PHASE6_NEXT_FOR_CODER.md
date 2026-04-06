# Next Steps For Coder (After Phase 6)

## Current State

Phase 6 scaffolding is complete.
Route exists and returns placeholder data.
No real sync logic is implemented yet.

## What To Do Next (When Approved)

Phase 7+ candidates:
1. Define sync request/response contract for /accounts/sync
2. Add validation layer for sync trigger payloads
3. Add service orchestration flow (still internal-only first)
4. Add controlled DB writes with explicit transaction boundaries
5. Add Google/Meta integration logic only after architect approval
6. Add structured logs and idempotency handling

## Safety Checklist Before Real Logic

- Confirm final folder naming convention (capitalized remains default)
- Confirm token encryption plan and key handling policy
- Confirm retry strategy and rate-limit handling policy
- Confirm error mapping for frontend/API contract

## Handover Rule

Do not introduce real provider API calls until explicit instruction for implementation phase beyond scaffolding.
