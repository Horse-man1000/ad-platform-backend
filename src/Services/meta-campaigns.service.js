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

async function fetchMetaCampaignsForAccount(accessToken, externalAccountId) {
  const normalizedAccountId = String(externalAccountId).startsWith("act_")
    ? String(externalAccountId)
    : `act_${externalAccountId}`;

  const url = new URL(`https://graph.facebook.com/v21.0/${normalizedAccountId}/campaigns`);
  url.searchParams.set("fields", "id,name,status,objective");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Meta campaign sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const campaigns = Array.isArray(payload?.data) ? payload.data : [];

  return campaigns
    .map((campaign) => ({
      externalCampaignId: campaign?.id ? String(campaign.id) : null,
      name: typeof campaign?.name === "string" ? campaign.name : null,
      status: campaign?.status ? String(campaign.status) : null,
      objective: campaign?.objective ? String(campaign.objective) : null,
    }))
    .filter((campaign) => campaign.externalCampaignId);
}

export async function syncMetaCampaigns(clientId, accounts) {
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
    const error = new Error("No Meta token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  let campaignsAdded = 0;
  let campaignsUpdated = 0;

  for (const account of accounts) {
    const campaigns = await fetchMetaCampaignsForAccount(accessToken, account.externalAccountId);

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
