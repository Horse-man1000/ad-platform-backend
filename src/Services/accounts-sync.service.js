import prisma from "../Config/prisma.js";
import { refreshToken as refreshGoogleToken } from "./OAuth/google.service.js";
import { refreshToken as refreshMetaToken } from "./OAuth/meta.service.js";
import { syncGoogleAccounts } from "./google-sync.service.js";
import { syncMetaAccounts } from "./meta-sync.service.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

function emptyPlatformState() {
  return {
    connected: false,
    synced: false,
    accountsAdded: 0,
    accountsUpdated: 0,
  };
}

export async function syncAccountsForClient(clientId) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = ERROR_CODES.CLIENT_NOT_FOUND;
    throw error;
  }

  const tokens = await prisma.clientToken.findMany({
    where: {
      clientId,
      platform: { in: ["google", "meta"] },
    },
    select: {
      platform: true,
    },
  });

  const connectedPlatforms = new Set(tokens.map((token) => token.platform));
  const result = {
    status: "ok",
    clientId,
    platforms: {
      google: emptyPlatformState(),
      meta: emptyPlatformState(),
    },
  };

  if (connectedPlatforms.has("google")) {
    result.platforms.google.connected = true;
    try {
      await refreshGoogleToken(clientId);
      const googleSummary = await syncGoogleAccounts(clientId);
      result.platforms.google.synced = true;
      result.platforms.google.accountsAdded = googleSummary.accountsAdded;
      result.platforms.google.accountsUpdated = googleSummary.accountsUpdated;
    } catch (error) {
      result.platforms.google.synced = false;
      result.platforms.google.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  if (connectedPlatforms.has("meta")) {
    result.platforms.meta.connected = true;
    try {
      await refreshMetaToken(clientId);
      const metaSummary = await syncMetaAccounts(clientId);
      result.platforms.meta.synced = true;
      result.platforms.meta.accountsAdded = metaSummary.accountsAdded;
      result.platforms.meta.accountsUpdated = metaSummary.accountsUpdated;
    } catch (error) {
      result.platforms.meta.synced = false;
      result.platforms.meta.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  return result;
}
