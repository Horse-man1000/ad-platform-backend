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

async function ensureAdSet(campaignId, externalAdSetId, adSetName) {
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
      name: adSetName || externalAdSetId,
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

async function fetchMetaAdsForCampaign(accessToken, externalCampaignId) {
  if (!externalCampaignId) {
    return [];
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${externalCampaignId}/ads`);
  url.searchParams.set("fields", "id,name,status,creative{id},adset{id,name}");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Meta ad sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const ads = Array.isArray(payload?.data) ? payload.data : [];

  return ads
    .map((ad) => ({
      externalAdId: ad?.id ? String(ad.id) : null,
      name: typeof ad?.name === "string" ? ad.name : null,
      status: ad?.status ? String(ad.status) : null,
      externalAdSetId: ad?.adset?.id ? String(ad.adset.id) : null,
      adSetName: typeof ad?.adset?.name === "string" ? ad.adset.name : null,
      creativeId: ad?.creative?.id ? String(ad.creative.id) : null,
    }))
    .filter((ad) => ad.externalAdId && ad.externalAdSetId);
}

export async function syncMetaAds(clientId, campaigns) {
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
    const error = new Error("No Meta token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  let adsAdded = 0;
  let adsUpdated = 0;

  for (const campaign of campaigns) {
    const ads = await fetchMetaAdsForCampaign(accessToken, campaign.externalCampaignId);

    for (const ad of ads) {
      const adsetId = await ensureAdSet(campaign.id, ad.externalAdSetId, ad.adSetName);
      const result = await upsertAd(adsetId, ad.externalAdId, ad.name, null, null);
      adsAdded += result.created;
      adsUpdated += result.updated;
    }
  }

  return {
    adsAdded,
    adsUpdated,
  };
}
