import prisma from "../Config/prisma.js";

export async function createClient(data) {
  return prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
    },
  });
}

export async function getClientById(id) {
  return prisma.client.findUnique({
    where: { id },
  });
}

export async function listClients(limit = 25) {
  return prisma.client.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}
