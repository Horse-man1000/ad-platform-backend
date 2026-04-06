# IMPLEMENTATION HANDOVER - PHASE 4 (OAUTH SCAFFOLDING)

## 1) Purpose

This handover is for the developer implementing Phase 4 of the ad-platform backend.
Phase 4 is structure and scaffolding only. No real OAuth logic is implemented in this phase.
Real OAuth implementation comes in Phase 5.

## 2) Current Baseline (Already Completed Before You Start)

- Express server running in src/app.js
- Routes exist for clients, tokens, accounts, campaigns, reports
- Service and utility layers exist under src/Services and src/Utils
- Prisma connected to PostgreSQL with existing schema and migration
- Folder naming convention is capitalized: src/API, src/Services, src/Utils, src/Config

## 3) Scope for This Phase (In Scope Only)

### 3a. Create folders (if not already present)

- src/API/Auth/
- src/Services/OAuth/

### 3b. Create placeholder route files

File: src/API/Auth/google.route.js
- Export an Express router
- Add empty handler for GET / (maps to /auth/google)
- Add empty handler for GET /callback (maps to /auth/google/callback)
- Use placeholder JSON responses and TODO comments only

File: src/API/Auth/meta.route.js
- Export an Express router
- Add empty handler for GET / (maps to /auth/meta)
- Add empty handler for GET /callback (maps to /auth/meta/callback)
- Use placeholder JSON responses and TODO comments only

### 3c. Create placeholder service files

File: src/Services/OAuth/google.service.js
- Export placeholder function: initiateAuth()
- Export placeholder function: handleCallback()
- Export placeholder function: refreshToken() (optional)
- No real logic. Return placeholder strings or objects with TODO comments.

File: src/Services/OAuth/meta.service.js
- Export placeholder function: initiateAuth()
- Export placeholder function: handleCallback()
- Export placeholder function: refreshToken() (optional)
- No real logic. Return placeholder strings or objects with TODO comments.

### 3d. Create placeholder OAuth utility file

File: src/Utils/oauth.util.js
- Export placeholder function: buildAuthURL()
- Export placeholder function: parseCallbackParams()
- Add TODO comment for encrypt/decrypt helpers (real logic comes in Phase 5)
- No real logic in any function

### 3e. Register routes in src/app.js

Import the two new route files and register them:
- app.use("/auth/google", googleAuthRouter)
- app.use("/auth/meta", metaAuthRouter)

Keep imports and registrations consistent with the existing route registration style in app.js.

## 4) Out of Scope (Do Not Implement)

- Real Google OAuth token exchange
- Real Meta OAuth token exchange
- Token encryption logic
- Token refresh logic
- Any calls to Google Ads API or Meta Marketing API
- Database reads or writes
- Schema changes or new migrations
- Environment variable changes
- Any business logic beyond placeholder stubs

## 5) Placeholder Code Contract

Each placeholder function or route handler must:
- Return simple JSON or a string indicating placeholder status
- Include a TODO comment describing what Phase 5 will implement there
- Not throw errors or crash the server

Example placeholder route response style:
```json
{
  "status": "ok",
  "module": "auth/google",
  "message": "placeholder - OAuth not yet implemented"
}
```

Example placeholder function style:
```js
export function initiateAuth() {
  // TODO: Phase 5 - build Google OAuth redirect URL using GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI
  return "initiateAuth placeholder";
}
```

## 6) Acceptance Criteria (Definition of Done)

Phase 4 is complete when all of the following are true:

1. src/API/Auth/google.route.js exists and exports a valid Express router
2. src/API/Auth/meta.route.js exists and exports a valid Express router
3. src/Services/OAuth/google.service.js exists with placeholder exports
4. src/Services/OAuth/meta.service.js exists with placeholder exports
5. src/Utils/oauth.util.js exists with placeholder exports
6. Routes are registered in src/app.js for /auth/google and /auth/meta
7. Server starts without errors after changes
8. GET /auth/google returns a placeholder JSON response
9. GET /auth/google/callback returns a placeholder JSON response
10. GET /auth/meta returns a placeholder JSON response
11. GET /auth/meta/callback returns a placeholder JSON response
12. No real OAuth logic, API calls, or database writes exist in any new file

## 7) Validation Steps

After implementation:

1. Run: npm start
2. Confirm server starts with no errors
3. Hit each of these endpoints and confirm placeholder JSON response:
   - GET /auth/google
   - GET /auth/google/callback
   - GET /auth/meta
   - GET /auth/meta/callback
4. Confirm existing endpoints still work:
   - GET /health
   - GET /version

## 8) Deliverables to Hand Back

Provide:
1. List of all files created
2. Confirmation server starts cleanly
3. Sample response from /auth/google
4. Any assumptions or blockers encountered

## 9) What Comes Next (Phase 5 - Not Your Concern Now)

After Phase 4 is accepted, Phase 5 will handle:
- Real Google OAuth implementation
- Real Meta OAuth implementation
- Token encryption using ENCRYPTION_KEY
- Token refresh logic
- Account syncing preparation

Phase 5 will be designed by the architect AI before being handed back for implementation.
