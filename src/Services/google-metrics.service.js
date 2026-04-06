import prisma from "../Config/prisma.js";
import { decrypt } from "../Utils/oauth.util.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

const PLATFORM = "google";

function parseStoredToken(value) {
  try {
    return decrypt(value);
  } catch {
    return value;
  }
}

function toDayStart(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function normalizeInt(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

function normalizeDecimalString(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toString() : "0";
}

async function upsertMetric(adId, date, impressions, clicks, spend, platform) {
  const existing = await prisma.adMetric.findFirst({
    where: {
      adId,
      date,
    },
  });

  if (!existing) {
    await prisma.adMetric.create({
      data: {
        adId,
        date,
        impressions,
        clicks,
        spend,
        platform,
      },
    });

    return { created: 1, updated: 0 };
  }

  if (
    existing.impressions === impressions &&
    existing.clicks === clicks &&
    Number(existing.spend || 0) === Number(spend || 0) &&
    existing.platform === platform
  ) {
    return { created: 0, updated: 0 };
  }

  await prisma.adMetric.update({
    where: { id: existing.id },
    data: {
      impressions,
      clicks,
      spend,
      platform,
    },
  });

  return { created: 0, updated: 1 };
}

async function fetchGoogleMetricsForAd(accessToken, adRecord, fromDate, toDate) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    const error = new Error("Google Ads developer token not configured");
    error.code = ERROR_CODES.SYNC_NOT_CONFIGURED;
    throw error;
  }

  const adId = adRecord.externalId;
  const campaignId = adRecord.adset.campaign.externalCampaignId;
  const customerId = String(adRecord.adset.campaign.account.externalAccountId || "").replace(
    "customers/",
    ""
  );

  if (!adId || !campaignId || !customerId) {
    return [];
  }

  const url = `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:searchStream`;
  const from = fromDate.toISOString().slice(0, 10);
  const to = toDate.toISOString().slice(0, 10);
  const query = {
    query:
      `SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros FROM ad_group_ad WHERE campaign.id = ${campaignId} AND ad_group_ad.ad.id = ${adId} AND segments.date BETWEEN '${from}' AND '${to}'`,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    const error = new Error("Google metrics sync failed");
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const batches = Array.isArray(payload) ? payload : [];
  const items = [];

  for (const batch of batches) {
    const results = Array.isArray(batch?.results) ? batch.results : [];
    for (const row of results) {
      const dateStr = row?.segments?.date;
      if (!dateStr) {
        continue;
      }

      items.push({
        date: toDayStart(dateStr),
        impressions: normalizeInt(row?.metrics?.impressions),
        clicks: normalizeInt(row?.metrics?.clicks),
        spend: normalizeDecimalString((Number(row?.metrics?.costMicros || 0) / 1000000).toFixed(6)),
      });
    }
  }

  return items;
}

export async function syncGoogleMetrics(clientId, ads, fromDate, toDate) {
  if (!Array.isArray(ads) || ads.length === 0) {
    return { metricsAdded: 0, metricsUpdated: 0 };
  }

  const tokenRecord = await prisma.clientToken.findUnique({
    where: {
      clientId_platform: {
        clientId,
        platform: PLATFORM,
      },
    },
    select: { accessToken: true },
  });

  if (!tokenRecord?.accessToken) {
    const error = new Error("No Google token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  let metricsAdded = 0;
  let metricsUpdated = 0;

  for (const ad of ads) {
    const points = await fetchGoogleMetricsForAd(accessToken, ad, fromDate, toDate);
    for (const point of points) {
      const result = await upsertMetric(
        ad.id,
        point.date,
        point.impressions,
        point.clicks,
        point.spend,
        PLATFORM
      );
      metricsAdded += result.created;
      metricsUpdated += result.updated;
    }
  }

  return {
    metricsAdded,
    metricsUpdated,
  };
}
