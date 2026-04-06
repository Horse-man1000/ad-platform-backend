import prisma from "../Config/prisma.js";
import { refreshToken as refreshGoogleToken } from "./OAuth/google.service.js";
import { refreshToken as refreshMetaToken } from "./OAuth/meta.service.js";
import { syncGoogleAds } from "./google-ads.service.js";
import { syncMetaAds } from "./meta-ads.service.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

function emptyPlatformState() {
  return {
    connected: false,
    synced: false,
    adsAdded: 0,
    adsUpdated: 0,
  };
}

export async function syncAdsForClient(clientId) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = ERROR_CODES.CLIENT_NOT_FOUND;
    throw error;
  }

  const [tokens, campaigns] = await Promise.all([
    prisma.clientToken.findMany({
      where: {
        clientId,
        platform: { in: ["google", "meta"] },
      },
      select: { platform: true },
    }),
    prisma.campaign.findMany({
      where: {
        account: {
          clientId,
          platform: { in: ["google", "meta"] },
        },
      },
      select: {
        id: true,
        externalCampaignId: true,
        account: {
          select: {
            id: true,
            platform: true,
            externalAccountId: true,
          },
        },
      },
    }),
  ]);

  const connectedPlatforms = new Set(tokens.map((token) => token.platform));
  const googleCampaigns = campaigns.filter((campaign) => campaign.account.platform === "google");
  const metaCampaigns = campaigns.filter((campaign) => campaign.account.platform === "meta");

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
      const summary = await syncGoogleAds(clientId, googleCampaigns);
      result.platforms.google.synced = true;
      result.platforms.google.adsAdded = summary.adsAdded;
      result.platforms.google.adsUpdated = summary.adsUpdated;
    } catch (error) {
      result.platforms.google.synced = false;
      result.platforms.google.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  if (connectedPlatforms.has("meta")) {
    result.platforms.meta.connected = true;
    try {
      await refreshMetaToken(clientId);
      const summary = await syncMetaAds(clientId, metaCampaigns);
      result.platforms.meta.synced = true;
      result.platforms.meta.adsAdded = summary.adsAdded;
      result.platforms.meta.adsUpdated = summary.adsUpdated;
    } catch (error) {
      result.platforms.meta.synced = false;
      result.platforms.meta.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  return result;
}
