# ad-platform backend

Backend foundation for consolidating ad data across platforms (Google Ads, Meta Ads, Instagram, and others).

## Current status

Implemented:
- Node.js + Express backend with Prisma + PostgreSQL
- CORS and environment variable checks at startup
- Health and version endpoints
- Clients module (create/list/get)
- Tokens module (save/get)
- Accounts module (create/get)

Placeholder modules:
- Campaigns
- Reports

## Prerequisites

- Node.js 20+ (current project was set up on Node 24.x)
- PostgreSQL running locally
- A database created (example: `adplatform`)

## Install and run

From the project root:

```bash
npm install
npm start
```

Server default URL:
- http://localhost:3000

## Environment variables

Copy `.env.example` to `.env` and fill your local values.

Required keys:
- `PORT`
- `DATABASE_URL`
- `ENCRYPTION_KEY`

Planned OAuth placeholders:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `META_CLIENT_ID`
- `META_CLIENT_SECRET`
- `META_REDIRECT_URI`

## Prisma commands

```bash
npx prisma generate
npx prisma migrate dev --name <migration_name>
```

## Seed and smoke test

Run these from project root:

```bash
npm run seed:dev
npm run smoke
```

Notes:
- `seed:dev` adds one demo client if not already present.
- `smoke` validates health/version plus clients/tokens/accounts flows.

## Current source layout

```text
src/
  API/
  Config/
  Services/
  Utils/
  app.js
```

Note: folder names are currently capitalized and should remain consistent unless a refactor is planned.

## Quick health check

After `npm start`, open:
- http://localhost:3000

Expected response:
- Ad Platform Backend Skeleton Loaded

## Troubleshooting

- Port already in use:
  - Change `PORT` in `.env`.
- Prisma migration connection failure:
  - Verify `DATABASE_URL` host, port, user, password, and database name.
- Server starts but no DB operations work:
  - Confirm PostgreSQL is running and the database exists.

## Next implementation tasks

- Implement real campaigns endpoints and service logic
- Implement real reports endpoints and service logic
- Add OAuth flows for Google and Meta
- Add background sync jobs
