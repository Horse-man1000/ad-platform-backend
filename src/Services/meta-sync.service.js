import prisma from "../Config/prisma.js";
import { decrypt } from "../Utils/oauth.util.js";
import { ERROR_CODES } from "../Utils/error-codes.js";

const PLATFORM = "meta";
const META_ACCOUNTS_URL = "https://graph.facebook.com/v21.0/me/adaccounts";

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

export async function syncMetaAccounts(clientId) {
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
    const error = new Error("No Meta token found for client");
    error.code = ERROR_CODES.NO_TOKEN;
    throw error;
  }

  const accessToken = parseStoredToken(tokenRecord.accessToken);
  const url = new URL(META_ACCOUNTS_URL);
  url.searchParams.set("fields", "id,name,currency,timezone_name,account_status");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Meta account sync failed: ${body}`);
    error.code = ERROR_CODES.PLATFORM_SYNC_FAILED;
    throw error;
  }

  const payload = await response.json();
  const accounts = Array.isArray(payload.data) ? payload.data : [];
  let accountsAdded = 0;
  let accountsUpdated = 0;

  for (const account of accounts) {
    const externalAccountId = account?.id ? String(account.id) : null;
    if (!externalAccountId) {
      continue;
    }

    const name = typeof account?.name === "string" ? account.name : null;
    const result = await upsertAdAccount(clientId, externalAccountId, name);
    accountsAdded += result.created;
    accountsUpdated += result.updated;
  }

  return {
    accountsAdded,
    accountsUpdated,
  };
}
