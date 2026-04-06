# PROJECT PLAN (Progress-Aligned)

This plan reflects the current state of the ad-platform backend and defines the next implementation phase.
It is aligned to the handover summary in brief for AI.txt and the current workspace structure.

## 1) Project Scope

Stack:
- Node.js
- Express
- PostgreSQL
- Prisma

Project objective:
- Build a backend service that consolidates advertising data from multiple platforms (Google Ads, Meta Ads, Instagram, etc.).

## 2) Completed Foundation (Verified)

The setup phase is complete and stable:
- Node project initialized with dependencies installed
- Prisma initialized and connected to PostgreSQL
- Database migration applied successfully
- Express server skeleton created and runnable
- Environment variable loading in place

Confirmed artifacts currently present:
- ad-platform/package.json
- ad-platform/package-lock.json
- ad-platform/node_modules/
- ad-platform/prisma/schema.prisma
- ad-platform/prisma/migrations/
- ad-platform/src/app.js
- ad-platform/.env (local)

## 3) Data Model Status

The Prisma schema already includes the planned core entities:
- Client
- ClientToken
- AdAccount
- Campaign
- AdSet
- Ad
- Report
- Project
- Event
- Competitor
- CompetitorAd

Status:
- Initial migration completed and tables created in PostgreSQL database adplatform.

## 4) Current Folder Direction

Current source folders:
- ad-platform/src/API/
- ad-platform/src/Config/
- ad-platform/src/Services/
- ad-platform/src/Utils/

Note:
- Folder names currently use capitalized naming. Keep naming consistent during upcoming implementation unless a deliberate refactor is approved.

## 5) Next Phase (Structure-First Plan)

Priority order from the appended NEXT STEPS brief:
1. Finalize internal module structure under src (api, services, utils, config)
2. Add placeholder route files for clients, tokens, accounts, campaigns, and reports
3. Register route placeholders in app.js so structure is wired end-to-end
4. Add a health endpoint (/health) for runtime verification
5. Optionally add a version endpoint (/version)
6. Create support docs: ROUTE_STRUCTURE.md, SERVICE_STRUCTURE.md, ENVIRONMENT.md, DATABASE_STRUCTURE.md
7. Keep business logic minimal until structure and docs are complete

Current workspace note:
- The equivalent folder structure already exists as capitalized folders (API, Services, Utils, Config).
- Continue with the current naming style unless an intentional rename plan is approved.

Out of scope until explicitly requested:
- Full OAuth flow implementation
- Campaign/ad/report sync jobs
- Production deployment pipeline

## 6) Environment and Security Policy

Rules:
- Never commit real secrets.
- Keep .env local.
- If .env.example is added, keep only placeholders.
- Store sensitive tokens encrypted at rest when token routes are implemented.

Required environment keys:
- PORT
- DATABASE_URL
- ENCRYPTION_KEY
- OAuth keys/secrets (placeholders until enabled)

## 7) Risks and Mitigation

Risk: Inconsistent folder naming conventions can create import confusion.
Mitigation: Use one naming style per phase; document it in README before expanding modules.

Risk: Token storage without encryption can expose sensitive credentials.
Mitigation: Implement encryption utility before persistent token handling.

Risk: Missing setup docs can slow onboarding.
Mitigation: Add README and .env.example before endpoint expansion grows.

## 8) Ownership

Project manager AI responsibilities:
- Keep planning docs synchronized with actual workspace state.
- Maintain a clear done/next tracker for implementation.
- Avoid claiming completion for unverified runtime behavior.
- Sequence work in small, testable increments.

## 9) Implementation Guardrail

Until structure-first milestones are complete:
- Prefer placeholders and wiring over full feature logic.
- Validate app boot and route registration after each structural addition.
- Track completion in FOLDER_CHECKLIST.md before moving to deeper integrations.
