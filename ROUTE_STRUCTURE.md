# ROUTE_STRUCTURE

## Phase 1 Route Map

- GET /
  - Basic root endpoint for quick server reachability.
- GET /health
  - Health check endpoint for local/runtime validation.
- GET /version
  - Returns package metadata for version visibility.

### Placeholder API Route Bases

- GET /api/clients/
- GET /api/tokens/
- GET /api/accounts/
- GET /api/campaigns/
- GET /api/reports/

Each placeholder returns JSON with:
- status
- module
- message
