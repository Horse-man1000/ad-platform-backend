import prisma from "../Config/prisma.js";
import { refreshToken as refreshGoogleToken } from "./OAuth/google.service.js";
import { refreshToken as refreshMetaToken } from "./OAuth/meta.service.js";
import { syncGoogleCampaigns } from "./google-campaigns.service.js";
import { syncMetaCampaigns } from "./meta-campaigns.service.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

function emptyPlatformState() {
  return {
    connected: false,
    synced: false,
    campaignsAdded: 0,
    campaignsUpdated: 0,
  };
}

export async function syncCampaignsForClient(clientId) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = ERROR_CODES.CLIENT_NOT_FOUND;
    throw error;
  }

  const [tokens, accounts] = await Promise.all([
    prisma.clientToken.findMany({
      where: {
        clientId,
        platform: { in: ["google", "meta"] },
      },
      select: { platform: true },
    }),
    prisma.adAccount.findMany({
      where: {
        clientId,
        platform: { in: ["google", "meta"] },
      },
      select: { id: true, platform: true, externalAccountId: true },
    }),
  ]);

  const connectedPlatforms = new Set(tokens.map((token) => token.platform));
  const googleAccounts = accounts.filter((account) => account.platform === "google");
  const metaAccounts = accounts.filter((account) => account.platform === "meta");

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
      const summary = await syncGoogleCampaigns(clientId, googleAccounts);
      result.platforms.google.synced = true;
      result.platforms.google.campaignsAdded = summary.campaignsAdded;
      result.platforms.google.campaignsUpdated = summary.campaignsUpdated;
    } catch (error) {
      result.platforms.google.synced = false;
      result.platforms.google.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  if (connectedPlatforms.has("meta")) {
    result.platforms.meta.connected = true;
    try {
      await refreshMetaToken(clientId);
      const summary = await syncMetaCampaigns(clientId, metaAccounts);
      result.platforms.meta.synced = true;
      result.platforms.meta.campaignsAdded = summary.campaignsAdded;
      result.platforms.meta.campaignsUpdated = summary.campaignsUpdated;
    } catch (error) {
      result.platforms.meta.synced = false;
      result.platforms.meta.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  return result;
}
