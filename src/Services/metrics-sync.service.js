import prisma from "../Config/prisma.js";
import { refreshToken as refreshGoogleToken } from "./OAuth/google.service.js";
import { refreshToken as refreshMetaToken } from "./OAuth/meta.service.js";
import { syncGoogleMetrics } from "./google-metrics.service.js";
import { syncMetaMetrics } from "./meta-metrics.service.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

function emptyPlatformState() {
  return {
    connected: false,
    synced: false,
    metricsAdded: 0,
    metricsUpdated: 0,
  };
}

function toDateOnlyString(value) {
  return value.toISOString().slice(0, 10);
}

export async function syncMetricsForClient(clientId, fromDate, toDate) {
  if (!(fromDate instanceof Date) || !(toDate instanceof Date) || fromDate > toDate) {
    const error = new Error("invalid date range");
    error.code = ERROR_CODES.INVALID_DATE_RANGE;
    throw error;
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = ERROR_CODES.CLIENT_NOT_FOUND;
    throw error;
  }

  const [tokens, ads] = await Promise.all([
    prisma.clientToken.findMany({
      where: {
        clientId,
        platform: { in: ["google", "meta"] },
      },
      select: { platform: true },
    }),
    prisma.ad.findMany({
      where: {
        adset: {
          campaign: {
            account: {
              clientId,
              platform: { in: ["google", "meta"] },
            },
          },
        },
      },
      select: {
        id: true,
        externalId: true,
        adset: {
          select: {
            externalId: true,
            campaign: {
              select: {
                externalCampaignId: true,
                account: {
                  select: {
                    platform: true,
                    externalAccountId: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const connectedPlatforms = new Set(tokens.map((token) => token.platform));
  const googleAds = ads.filter((ad) => ad.adset.campaign.account.platform === "google");
  const metaAds = ads.filter((ad) => ad.adset.campaign.account.platform === "meta");

  const result = {
    status: "ok",
    clientId,
    range: {
      from: toDateOnlyString(fromDate),
      to: toDateOnlyString(toDate),
    },
    platforms: {
      google: emptyPlatformState(),
      meta: emptyPlatformState(),
    },
  };

  if (connectedPlatforms.has("google")) {
    result.platforms.google.connected = true;
    try {
      await refreshGoogleToken(clientId);
      if (googleAds.length === 0) {
        result.platforms.google.reason = ERROR_CODES.NO_ADS;
      } else {
        const summary = await syncGoogleMetrics(clientId, googleAds, fromDate, toDate);
        result.platforms.google.synced = true;
        result.platforms.google.metricsAdded = summary.metricsAdded;
        result.platforms.google.metricsUpdated = summary.metricsUpdated;
      }
    } catch (error) {
      result.platforms.google.synced = false;
      result.platforms.google.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  if (connectedPlatforms.has("meta")) {
    result.platforms.meta.connected = true;
    try {
      await refreshMetaToken(clientId);
      if (metaAds.length === 0) {
        result.platforms.meta.reason = ERROR_CODES.NO_ADS;
      } else {
        const summary = await syncMetaMetrics(clientId, metaAds, fromDate, toDate);
        result.platforms.meta.synced = true;
        result.platforms.meta.metricsAdded = summary.metricsAdded;
        result.platforms.meta.metricsUpdated = summary.metricsUpdated;
      }
    } catch (error) {
      result.platforms.meta.synced = false;
      result.platforms.meta.reason = error.code || ERROR_CODES.SYNC_FAILED;
    }
  }

  return result;
}
