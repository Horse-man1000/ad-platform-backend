# FOLDER AND FILE CHECKLIST

Use this tracker to monitor backend setup and structure-first implementation tasks.

Status key:
- Done
- Not done

## Core Folders

- Done: ad-platform/
- Done: ad-platform/src/
- Done: ad-platform/prisma/
- Done: ad-platform/Plan from other AI/

## Documentation Files

- Done: ad-platform/PROJECT_PLAN.md
- Done: ad-platform/FOLDER_CHECKLIST.md
- Done: ad-platform/README.md
- Done: ad-platform/brief for AI.txt

## Environment Files

- Done: ad-platform/.env.example
- Done: ad-platform/.env (local only)
- Done: ad-platform/ad-platform.env

## Package and Dependency Artifacts

- Done: ad-platform/package.json
- Done: ad-platform/package-lock.json
- Done: ad-platform/node_modules/

## Prisma Artifacts

- Done: ad-platform/prisma/schema.prisma
- Done: ad-platform/prisma/migrations/

## Source Structure (Current)

- Done: ad-platform/src/API/
- Done: ad-platform/src/Services/
- Done: ad-platform/src/Utils/
- Done: ad-platform/src/Config/
- Done: ad-platform/src/app.js

## Required Command Progress

- Done: npm init -y
- Done: npm install express cors axios dotenv
- Done: npm install prisma @prisma/client
- Done: npx prisma init
- Done: npx prisma migrate dev --name init
- Done: node src/app.js

## Next Implementation Tasks

- Not done: Add placeholder route files in src/API (clients, tokens, accounts, campaigns, reports)
- Not done: Register route placeholders in src/app.js
- Not done: Add health endpoint (/health)
- Not done: Add optional version endpoint (/version)
- Not done: Create ROUTE_STRUCTURE.md
- Not done: Create SERVICE_STRUCTURE.md
- Not done: Create ENVIRONMENT.md
- Not done: Create DATABASE_STRUCTURE.md
- Not done: Add initial service placeholders in src/Services
- Not done: Add initial utility placeholders in src/Utils
- Not done: Decide and document folder naming convention (API vs api)
- Done: Add README with onboarding and troubleshooting
- Done: Add .env.example with placeholders only
