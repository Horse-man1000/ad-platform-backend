# SYSTEM OVERVIEW

## What This Backend Does

This backend provides read-only sync workflows for ad data ingestion into a local database.
It supports:

- OAuth token storage and refresh for Google and Meta
- Account sync into local `AdAccount` records
- Campaign sync into local `Campaign` records
- Basic client/account/token API endpoints for integration and testing

## What This Backend Does Not Do

This backend does not currently:

- create or modify campaigns on Google/Meta provider APIs
- auto-delete local accounts or campaigns during sync
- run background jobs/schedulers for automatic syncing
- include deployment orchestration

## High-Level Flow

1. OAuth
- User connects provider account through OAuth callbacks.
- Access/refresh tokens are stored in local `ClientToken` records.

2. Accounts Sync
- `GET /accounts/sync?clientId=N`
- Detects connected platforms from `ClientToken` records.
- Refreshes token where applicable.
- Reads provider account data.
- Idempotently upserts local `AdAccount` rows.

3. Campaigns Sync
- `GET /campaigns/sync?clientId=N`
- Loads local ad accounts for the client.
- Refreshes token where applicable.
- Reads provider campaign data per account.
- Idempotently upserts local `Campaign` rows.

## How To Trigger Sync Endpoints

Accounts sync:

```bash
curl -i "http://localhost:3000/accounts/sync?clientId=2"
```

Campaigns sync:

```bash
curl -i "http://localhost:3000/campaigns/sync?clientId=2"
```

## Example Normal Response Shapes

Accounts sync response:

```json
{
  "status": "ok",
  "clientId": 2,
  "platforms": {
    "google": {
      "connected": false,
      "synced": false,
      "accountsAdded": 0,
      "accountsUpdated": 0
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

Campaigns sync response:

```json
{
  "status": "ok",
  "clientId": 2,
  "platforms": {
    "google": {
      "connected": false,
      "synced": false,
      "campaignsAdded": 0,
      "campaignsUpdated": 0
    },
    "meta": {
      "connected": false,
      "synced": false,
      "campaignsAdded": 0,
      "campaignsUpdated": 0
    }
  }
}
```
