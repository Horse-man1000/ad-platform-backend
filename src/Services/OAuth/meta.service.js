import prisma from "../../Config/prisma.js";
import { buildAuthURL, generateState, parseState, encrypt, decrypt } from "../../Utils/oauth.util.js";

const PLATFORM = "meta";
const META_SCOPES = "ads_read,ads_management";
const META_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token";

export function initiateAuth(clientId) {
  const { META_CLIENT_ID, META_REDIRECT_URI } = process.env;
  if (!META_CLIENT_ID || !META_REDIRECT_URI) {
    const err = new Error("Meta OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }
  const state = generateState(clientId);
  return buildAuthURL("meta", {
    client_id: META_CLIENT_ID,
    redirect_uri: META_REDIRECT_URI,
    response_type: "code",
    scope: META_SCOPES,
    state,
  });
}

export async function handleCallback(code, state) {
  const { META_CLIENT_ID, META_CLIENT_SECRET, META_REDIRECT_URI } = process.env;
  if (!META_CLIENT_ID || !META_CLIENT_SECRET || !META_REDIRECT_URI) {
    const err = new Error("Meta OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }

  const stateData = parseState(state);
  if (!stateData?.clientId) {
    const err = new Error("Invalid or missing OAuth state");
    err.code = "INVALID_STATE";
    throw err;
  }

  const params = new URLSearchParams({
    code,
    client_id: META_CLIENT_ID,
    client_secret: META_CLIENT_SECRET,
    redirect_uri: META_REDIRECT_URI,
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Meta token exchange failed: ${body}`);
    err.code = "TOKEN_EXCHANGE_FAILED";
    throw err;
  }

  const tokens = await response.json();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const record = await prisma.clientToken.upsert({
    where: { clientId_platform: { clientId: stateData.clientId, platform: PLATFORM } },
    update: { accessToken: encrypt(tokens.access_token), expiresAt },
    create: {
      clientId: stateData.clientId,
      platform: PLATFORM,
      accessToken: encrypt(tokens.access_token),
      refreshToken: null,
      expiresAt,
    },
  });

  return { id: record.id, clientId: record.clientId, platform: record.platform, expiresAt: record.expiresAt };
}

export async function refreshToken(clientId) {
  const { META_CLIENT_ID, META_CLIENT_SECRET } = process.env;
  if (!META_CLIENT_ID || !META_CLIENT_SECRET) {
    const err = new Error("Meta OAuth credentials not configured");
    err.code = "OAUTH_NOT_CONFIGURED";
    throw err;
  }

  const record = await prisma.clientToken.findUnique({
    where: { clientId_platform: { clientId, platform: PLATFORM } },
  });

  if (!record?.accessToken) {
    const err = new Error("No token stored for this client");
    err.code = "NO_REFRESH_TOKEN";
    throw err;
  }

  // Meta uses long-lived token extension via fb_exchange_token instead of a standard refresh flow
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: META_CLIENT_ID,
    client_secret: META_CLIENT_SECRET,
    fb_exchange_token: decrypt(record.accessToken),
  });

  const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`);

  if (!response.ok) {
    const body = await response.text();
    const err = new Error(`Meta token refresh failed: ${body}`);
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
