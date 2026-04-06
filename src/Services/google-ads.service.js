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

async function ensureAdSet(campaignId, externalAdSetId) {
  const existing = await prisma.adSet.findFirst({
    where: {
      campaignId,
      externalId: externalAdSetId,
    },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.adSet.create({
    data: {
      campaignId,
      externalId: externalAdSetId,
      name: externalAdSetId,
    },
  });

  return created.id;
}

async function upsertAd(adsetId, externalAdId, name, type, url) {
  const existing = await prisma.ad.findFirst({
    where: {
      adsetId,
      externalId: externalAdId,
    },
  });

  if (!existing) {
    await prisma.ad.create({
      data: {
        adsetId,
        externalId: externalAdId,
        name,
        type,
        url,
      },
    });

    return { created: 1, updated: 0 };
  }

  const nextName = name ?? existing.name;
  const nextType = type ?? existing.type;
  const nextUrl = url ?? existing.url;
  if (existing.name === nextName && existing.type === nextType && existing.url === nextUrl) {
    return { created: 0, updated: 0 };
  }

  await prisma.ad.update({
    where: { id: existing.id },
    data: {
      name: nextName,
      type: nextType,
      url: nextUrl,
    },
  });

  return { created: 0, updated: 1 };
}

async function fetchGoogleAdsForCampaign(accessToken, externalAccountId, externalCampaignId) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    const error = new Error("Google Ads developer token not configured");
    error.code = ERROR_CODES.SYNC_NOT_CONFIGURED;
    throw error;
  }

  if (!externalCampaignId) {
    return [];
  }

  const customerId = String(externalAccountId).replace("customers/", "");
  const url = `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:searchStream`;
  const query = {
    query:
      `SELECT ad_group.id, ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status FROM ad_group_ad WHERE campaign.id = ${externalCampaignId}`,
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
    const body = await response.text();
    const error = new Error(`Google ad sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const batches = Array.isArray(payload) ? payload : [];
  const items = [];

  for (const batch of batches) {
    const results = Array.isArray(batch?.results) ? batch.results : [];
    for (const row of results) {
      const ad = row?.adGroupAd?.ad;
      const externalAdId = ad?.id ? String(ad.id) : null;
      const externalAdSetId = row?.adGroup?.id ? String(row.adGroup.id) : null;
      if (!externalAdId || !externalAdSetId) {
        continue;
      }

      items.push({
        externalAdSetId,
        externalAdId,
        name: typeof ad?.name === "string" ? ad.name : null,
        type: ad?.type ? String(ad.type) : null,
        status: row?.adGroupAd?.status ? String(row.adGroupAd.status) : null,
      });
    }
  }

  return items;
}

export async function syncGoogleAds(clientId, campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return { adsAdded: 0, adsUpdated: 0 };
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
  let adsAdded = 0;
  let adsUpdated = 0;

  for (const campaign of campaigns) {
    const externalCampaignId = campaign.externalCampaignId;
    const externalAccountId = campaign.account.externalAccountId;

    const ads = await fetchGoogleAdsForCampaign(accessToken, externalAccountId, externalCampaignId);

    for (const ad of ads) {
      const adsetId = await ensureAdSet(campaign.id, ad.externalAdSetId);
      const result = await upsertAd(adsetId, ad.externalAdId, ad.name, ad.type, null);
      adsAdded += result.created;
      adsUpdated += result.updated;
    }
  }

  return {
    adsAdded,
    adsUpdated,
  };
}
