import prisma from "../Config/prisma.js";
import { decrypt } from "../Utils/oauth.util.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

const PLATFORM = "meta";

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

async function fetchMetaMetricsForAd(accessToken, adRecord, fromDate, toDate) {
  const adId = adRecord.externalId;
  if (!adId) {
    return [];
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${adId}/insights`);
  url.searchParams.set("time_increment", "1");
  url.searchParams.set("time_range", JSON.stringify({ from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10) }));
  url.searchParams.set("fields", "date_start,impressions,clicks,spend");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error("Meta metrics sync failed");
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];

  return rows
    .map((row) => ({
      date: row?.date_start ? toDayStart(row.date_start) : null,
      impressions: normalizeInt(row?.impressions),
      clicks: normalizeInt(row?.clicks),
      spend: normalizeDecimalString(row?.spend),
    }))
    .filter((row) => row.date);
}

export async function syncMetaMetrics(clientId, ads, fromDate, toDate) {
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
    const error = new Error("No Meta token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  let metricsAdded = 0;
  let metricsUpdated = 0;

  for (const ad of ads) {
    const points = await fetchMetaMetricsForAd(accessToken, ad, fromDate, toDate);
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
