import prisma from "../Config/prisma.js";

export async function saveClientToken(data) {
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = "CLIENT_NOT_FOUND";
    throw error;
  }

  return prisma.clientToken.upsert({
    where: {
      clientId_platform: {
        clientId: data.clientId,
        platform: data.platform,
      },
    },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    },
    create: {
      clientId: data.clientId,
      platform: data.platform,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
    },
  });
}

export async function getClientToken(clientId, platform) {
  return prisma.clientToken.findUnique({
    where: {
      clientId_platform: {
        clientId,
        platform,
      },
    },
  });
}
