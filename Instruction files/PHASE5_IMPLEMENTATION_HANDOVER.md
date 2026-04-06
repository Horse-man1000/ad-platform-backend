# IMPLEMENTATION HANDOVER - PHASE 5 (REAL OAUTH)

## 1) Purpose

This handover describes what was implemented in Phase 5 of the ad-platform backend.
Phase 5 replaces all Phase 4 OAuth placeholders with real working logic for Google and Meta OAuth flows.
No frontend integration is covered here — this is backend only.

---

## 2) Baseline Before Phase 5 Started

The following was already in place before this phase began:

- Express server running at src/app.js
- `/auth/google` and `/auth/meta` routes already registered in app.js (no changes needed there)
- Phase 4 placeholder files existed in:
  - src/API/Auth/google.route.js
  - src/API/Auth/meta.route.js
  - src/Services/OAuth/google.service.js
  - src/Services/OAuth/meta.service.js
  - src/Utils/oauth.util.js
- Shared utilities available:
  - src/Utils/response.util.js — exports `successResponse`, `errorResponse`
  - src/Utils/validation.util.js — exports `parsePositiveInt`, `requireNonEmptyString`, etc.
  - src/Utils/token.util.js — exports `normalizePlatform`, `maskToken`
- Prisma connected to PostgreSQL with `ClientToken` model
- `ClientToken` has a unique constraint on `[clientId, platform]` (used for upsert)
- `ENCRYPTION_KEY` env var — warns on startup if missing, does not block the server
- Native `fetch` available (Node 24, no extra packages needed)

---

## 3) What Was Implemented

### 3a. src/Utils/oauth.util.js — Replaced with real implementation

All placeholder functions replaced and new functions added:

**`encrypt(text)`**
- Uses AES-256-GCM from Node's built-in `crypto` module
- Reads `ENCRYPTION_KEY` from environment (must be set before using OAuth in production)
- Returns a string in the format: `ivHex:authTagHex:encryptedHex`
- Throws an error if `ENCRYPTION_KEY` is not set

**`decrypt(encryptedText)`**
- Reverses `encrypt()` using the same key
- Expects input in `ivHex:authTagHex:encryptedHex` format
- Throws an error if `ENCRYPTION_KEY` is not set or if the format is invalid

**`generateState(clientId)`**
- Creates a base64url-encoded JSON string containing `{ clientId, nonce }`
- The nonce is 16 random bytes (hex) — prevents CSRF replay attacks
- Used when starting an OAuth flow so the callback can identify which client it belongs to

**`parseState(state)`**
- Decodes a base64url state string back into `{ clientId, nonce }`
- Returns `null` if the string is malformed (does not throw)

**`buildAuthURL(provider, params)`**
- Accepts `"google"` or `"meta"` as provider
- Google base URL: `https://accounts.google.com/o/oauth2/v2/auth`
- Meta base URL: `https://www.facebook.com/v21.0/dialog/oauth`
- Appends all entries from `params` as URL query parameters
- Throws if provider is unrecognised

**`parseCallbackParams(query)`**
- Extracts `code`, `state`, `error`, and `errorDescription` from a callback query object
- Returns null for any field that is absent

---

### 3b. src/Services/OAuth/google.service.js — Replaced with real implementation

**`initiateAuth(clientId)`** — synchronous
- Reads `GOOGLE_CLIENT_ID` and `GOOGLE_REDIRECT_URI` from environment
- Throws with `err.code = "OAUTH_NOT_CONFIGURED"` if either is missing
- Generates a state token using `generateState(clientId)`
- Builds and returns the full Google consent URL with:
  - Scopes: `https://www.googleapis.com/auth/adwords openid email`
  - `access_type: offline` (to receive a refresh token)
  - `prompt: consent` (forces Google to issue a new refresh token)

**`handleCallback(code, state)`** — async
- Reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` from environment
- Throws `OAUTH_NOT_CONFIGURED` if any are missing
- Parses the state using `parseState()` — throws `INVALID_STATE` if clientId is not recovered
- POSTs to `https://oauth2.googleapis.com/token` with `grant_type: authorization_code`
- Throws `TOKEN_EXCHANGE_FAILED` if Google returns a non-200 response
- Encrypts the access token (and refresh token if present) before storing
- Upserts `ClientToken` record in Prisma using `clientId + platform` as the unique key
- Returns: `{ id, clientId, platform, expiresAt }`

**`refreshToken(clientId)`** — async
- Reads `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` from environment
- Looks up the stored `ClientToken` for this client
- Throws `NO_REFRESH_TOKEN` if no record or no refresh token is stored
- Decrypts the stored refresh token, POSTs to Google's token endpoint with `grant_type: refresh_token`
- Throws `TOKEN_REFRESH_FAILED` if Google returns a non-200 response
- Encrypts the new access token and updates the record in Prisma
- Returns: `{ clientId, platform, expiresAt }`

---

### 3c. src/Services/OAuth/meta.service.js — Replaced with real implementation

Same structure as google.service.js, with these Meta-specific differences:

**`initiateAuth(clientId)`**
- Reads `META_CLIENT_ID` and `META_REDIRECT_URI` from environment
- Scopes: `ads_read,ads_management`
- No `access_type` or `prompt` params (Meta does not use them)

**`handleCallback(code, state)`**
- Meta's token endpoint is a GET request (not POST): `https://graph.facebook.com/v21.0/oauth/access_token`
- Params are passed as query string, not request body
- Meta does not always return a refresh token — `refreshToken` is stored as null if absent

**`refreshToken(clientId)`**
- Meta does not use a standard `refresh_token` grant
- Instead, uses `grant_type: fb_exchange_token` to exchange the current access token for a new long-lived one
- Reads and decrypts the stored `accessToken` (not refreshToken)
- Throws `NO_REFRESH_TOKEN` if no token record exists for this client

---

### 3d. src/API/Auth/google.route.js — Replaced with real handlers

**`GET /auth/google?clientId=N`**
- Validates `clientId` using `parsePositiveInt` — returns 400 if missing or invalid
- Calls `initiateAuth(clientId)` to get the Google consent URL
- Redirects the user to that URL using `res.redirect()`
- Returns 503 JSON if `OAUTH_NOT_CONFIGURED`
- Returns 500 JSON for unexpected errors

**`GET /auth/google/callback`**
- Parses `code`, `state`, `error`, `error_description` from query params
- If `error` is present (user denied), returns 400 with the error description
- If `code` or `state` are missing, returns 400
- Calls `handleCallback(code, state)` and returns JSON success with token metadata
- Maps error codes to HTTP status: `INVALID_STATE` → 400, `TOKEN_EXCHANGE_FAILED` → 502, `OAUTH_NOT_CONFIGURED` → 503

**`POST /auth/google/refresh`**
- Reads `clientId` from request body, validates with `parsePositiveInt`
- Calls `refreshToken(clientId)` and returns JSON success
- Maps error codes: `NO_REFRESH_TOKEN` → 404, `TOKEN_REFRESH_FAILED` → 502, `OAUTH_NOT_CONFIGURED` → 503

---

### 3e. src/API/Auth/meta.route.js — Replaced with real handlers

Identical structure to google.route.js, using Meta service and Meta-specific error messages.

---

## 4) Environment Variables Required

These must be set in the `.env` file before the OAuth flows will work.
Do not put real credentials in any file that is committed to version control.

```
GOOGLE_CLIENT_ID=        # from Google Cloud Console
GOOGLE_CLIENT_SECRET=    # from Google Cloud Console
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

META_CLIENT_ID=          # from Meta Developer App
META_CLIENT_SECRET=      # from Meta Developer App
META_REDIRECT_URI=http://localhost:3000/auth/meta/callback

ENCRYPTION_KEY=          # any 32-character random string — used to encrypt tokens at rest
```

If these are not set, the server will still start. Requests to the OAuth endpoints will return a `503` JSON response instead of crashing.

---

## 5) Error Code Reference

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `OAUTH_NOT_CONFIGURED` | Required env vars missing | 503 |
| `INVALID_STATE` | State param missing or undecodable | 400 |
| `TOKEN_EXCHANGE_FAILED` | Provider rejected the auth code | 502 |
| `TOKEN_REFRESH_FAILED` | Provider rejected the refresh request | 502 |
| `NO_REFRESH_TOKEN` | No token stored in DB for this client | 404 |

---

## 6) Files Changed in This Phase

| File | Action |
|------|--------|
| src/Utils/oauth.util.js | Replaced placeholder with real encrypt/decrypt/state/URL helpers |
| src/Services/OAuth/google.service.js | Replaced placeholder with real Google OAuth logic |
| src/Services/OAuth/meta.service.js | Replaced placeholder with real Meta OAuth logic |
| src/API/Auth/google.route.js | Replaced placeholder with real route handlers |
| src/API/Auth/meta.route.js | Replaced placeholder with real route handlers |
| src/app.js | No changes — routes were already registered in Phase 4 |

---

## 7) How to Test

Run the server:
```
npm start
```

Test that validation works (server must be running):
```
# Should return 400 — missing clientId
GET http://localhost:3000/auth/google

# Should return 503 — credentials not in .env
GET http://localhost:3000/auth/google?clientId=1

# Should return 400 — missing code and state
GET http://localhost:3000/auth/google/callback

# Same tests for meta
GET http://localhost:3000/auth/meta
GET http://localhost:3000/auth/meta?clientId=1
GET http://localhost:3000/auth/meta/callback
```

Run the full smoke test to confirm nothing else broke:
```
npm run smoke
```

To test the full OAuth flow end-to-end you will need valid credentials in `.env` and a browser to complete the consent screen.

---

## 8) What Is NOT in Scope for This Phase

- Frontend integration — the OAuth redirect must be triggered from a browser (not Postman/curl for the initiate step)
- Campaign or reporting API routes — those remain as placeholders
- Any admin dashboard or UI
- Webhook handling for token revocation
