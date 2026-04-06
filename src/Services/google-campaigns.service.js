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

async function upsertCampaign(accountId, externalCampaignId, name, status) {
  const existing = await prisma.campaign.findFirst({
    where: {
      accountId,
      externalCampaignId,
    },
  });

  if (!existing) {
    await prisma.campaign.create({
      data: {
        accountId,
        externalCampaignId,
        name,
        status,
      },
    });

    return { created: 1, updated: 0 };
  }

  const nextName = name ?? existing.name;
  const nextStatus = status ?? existing.status;
  if (existing.name === nextName && existing.status === nextStatus) {
    return { created: 0, updated: 0 };
  }

  await prisma.campaign.update({
    where: { id: existing.id },
    data: {
      name: nextName,
      status: nextStatus,
    },
  });

  return { created: 0, updated: 1 };
}

async function fetchGoogleCampaignsForAccount(accessToken, externalAccountId) {
  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    const error = new Error("Google Ads developer token not configured");
    error.code = ERROR_CODES.SYNC_NOT_CONFIGURED;
    throw error;
  }

  const customerId = String(externalAccountId).replace("customers/", "");
  const url = `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:searchStream`;
  const query = {
    query:
      "SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type FROM campaign ORDER BY campaign.id",
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
    const error = new Error(`Google campaign sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const batches = Array.isArray(payload) ? payload : [];
  const items = [];

  for (const batch of batches) {
    const results = Array.isArray(batch?.results) ? batch.results : [];
    for (const row of results) {
      const campaign = row?.campaign;
      const externalCampaignId = campaign?.id ? String(campaign.id) : null;
      if (!externalCampaignId) {
        continue;
      }

      items.push({
        externalCampaignId,
        name: typeof campaign?.name === "string" ? campaign.name : null,
        status: campaign?.status ? String(campaign.status) : null,
      });
    }
  }

  return items;
}

export async function syncGoogleCampaigns(clientId, accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { campaignsAdded: 0, campaignsUpdated: 0 };
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
  let campaignsAdded = 0;
  let campaignsUpdated = 0;

  for (const account of accounts) {
    const campaigns = await fetchGoogleCampaignsForAccount(accessToken, account.externalAccountId);

    for (const campaign of campaigns) {
      const result = await upsertCampaign(
        account.id,
        campaign.externalCampaignId,
        campaign.name,
        campaign.status
      );
      campaignsAdded += result.created;
      campaignsUpdated += result.updated;
    }
  }

  return {
    campaignsAdded,
    campaignsUpdated,
  };
}
