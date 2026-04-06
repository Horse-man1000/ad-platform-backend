import prisma from "../Config/prisma.js";

export async function createAdAccount(data) {
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { id: true },
  });

  if (!client) {
    const error = new Error("client not found");
    error.code = "CLIENT_NOT_FOUND";
    throw error;
  }

  return prisma.adAccount.create({
    data: {
      clientId: data.clientId,
      platform: data.platform,
      externalAccountId: data.externalAccountId,
      name: data.name,
    },
  });
}

export async function getAdAccountById(id) {
  return prisma.adAccount.findUnique({
    where: { id },
  });
}
