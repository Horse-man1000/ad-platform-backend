import prisma from "../Config/prisma.js";
import { decrypt } from "../Utils/oauth.util.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

const PLATFORM = "google";
const GOOGLE_ACCESSIBLE_CUSTOMERS_URL =
  "https://googleads.googleapis.com/v20/customers:listAccessibleCustomers";

function buildGoogleMetadataQuery(customerId) {
  return {
    query:
      "SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone, customer.status FROM customer LIMIT 1",
  };
}

async function fetchGoogleAccountMetadata(accessToken, customerId) {
  const metadataUrl = `https://googleads.googleapis.com/v20/customers/${customerId}/googleAds:searchStream`;
  const response = await fetch(metadataUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGoogleMetadataQuery(customerId)),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const firstBatch = Array.isArray(payload) ? payload[0] : null;
  const firstResult = firstBatch?.results?.[0]?.customer;
  if (!firstResult) {
    return null;
  }

  return {
    id: firstResult.id ? String(firstResult.id) : customerId,
    name: firstResult.descriptiveName || null,
    currency: firstResult.currencyCode || null,
    timezone: firstResult.timeZone || null,
    status: firstResult.status || null,
  };
}

function parseStoredToken(value) {
  try {
    return decrypt(value);
  } catch {
    // Backward-compatible with any plain-text token rows created before encryption.
    return value;
  }
}

async function upsertAdAccount(clientId, externalAccountId, name) {
  const existing = await prisma.adAccount.findFirst({
    where: {
      clientId,
      platform: PLATFORM,
      externalAccountId,
    },
  });

  if (!existing) {
    await prisma.adAccount.create({
      data: {
        clientId,
        platform: PLATFORM,
        externalAccountId,
        name,
      },
    });

    return { created: 1, updated: 0 };
  }

  const nextName = name ?? existing.name;
  if (existing.name === nextName) {
    return { created: 0, updated: 0 };
  }

  await prisma.adAccount.update({
    where: { id: existing.id },
    data: {
      name: nextName,
    },
  });

  return { created: 0, updated: 1 };
}

export async function syncGoogleAccounts(clientId) {
  const tokenRecord = await prisma.clientToken.findUnique({
    where: {
      clientId_platform: {
        clientId,
        platform: PLATFORM,
      },
    },
    select: {
      accessToken: true,
    },
  });

  if (!tokenRecord?.accessToken) {
    const error = new Error("No Google token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
    const error = new Error("Google Ads developer token not configured");
    error.code = ERROR_CODES.SYNC_NOT_CONFIGURED;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  const response = await fetch(GOOGLE_ACCESSIBLE_CUSTOMERS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Google account sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const resources = Array.isArray(payload.resourceNames) ? payload.resourceNames : [];
  let accountsAdded = 0;
  let accountsUpdated = 0;

  for (const resourceName of resources) {
    const customerId = String(resourceName).replace("customers/", "");
    if (!customerId) {
      continue;
    }

    const metadata = await fetchGoogleAccountMetadata(accessToken, customerId);
    const externalAccountId = metadata?.id || customerId;
    if (!externalAccountId) {
      continue;
    }

    const displayName = metadata?.name || `Google ${externalAccountId}`;
    const result = await upsertAdAccount(clientId, externalAccountId, displayName);
    accountsAdded += result.created;
    accountsUpdated += result.updated;
  }

  return {
    accountsAdded,
    accountsUpdated,
  };
}
