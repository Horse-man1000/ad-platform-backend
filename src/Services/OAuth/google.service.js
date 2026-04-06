import prisma from "../../Config/prisma.js";
import { buildAuthURL, generateState, parseState, encrypt, decrypt } from "../../Utils/oauth.util.js";

const PLATFORM = "google";
const GOOGLE_SCOPES = "https://www.googleapis.com/auth/adwords openid email";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function initiateAuth(clientId) {
  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    const err = new Error("Google OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }
  const state = generateState(clientId);
  return buildAuthURL("google", {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
}

export async function handleCallback(code, state) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    const err = new Error("Google OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }

  const stateData = parseState(state);
  if (!stateData?.clientId) {
    const err = new Error("Invalid or missing OAuth state");
    err.code = "INVALID_STATE";
    throw err;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Google token exchange failed: ${body}`);
    err.code = "TOKEN_EXCHANGE_FAILED";
    throw err;
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const record = await prisma.clientToken.upsert({
    where: { clientId_platform: { clientId: stateData.clientId, platform: PLATFORM } },
    update: {
      accessToken: encrypt(tokens.access_token),
      ...(tokens.refresh_token && { refreshToken: encrypt(tokens.refresh_token) }),
      expiresAt,
    },
    create: {
      clientId: stateData.clientId,
      platform: PLATFORM,
      accessToken: encrypt(tokens.access_token),
      refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
      expiresAt,
    },
  });

  return { id: record.id, clientId: record.clientId, platform: record.platform, expiresAt: record.expiresAt };
}

export async function refreshToken(clientId) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    const err = new Error("Google OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }

  const record = await prisma.clientToken.findUnique({
    where: { clientId_platform: { clientId, platform: PLATFORM } },
  });

  if (!record?.refreshToken) {
    const err = new Error("No refresh token stored for this client");
    err.code = "NO_REFRESH_TOKEN";
    throw err;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: decrypt(record.refreshToken),
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }).toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Google token refresh failed: ${body}`);
    err.code = "TOKEN_REFRESH_FAILED";
    throw err;
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  await prisma.clientToken.update({
    where: { clientId_platform: { clientId, platform: PLATFORM } },
    data: { accessToken: encrypt(tokens.access_token), expiresAt },
  });

  return { clientId, platform: PLATFORM, expiresAt };
}
