import prisma from "../src/Config/prisma.js";

async function main() {
  const existing = await prisma.client.findFirst({
    where: { email: "demo-client@adplatform.local" },
  });

  if (existing) {
    console.log(`Seed already present. CLIENT_ID=${existing.id}`);
    return;
  }

  const client = await prisma.client.create({
    data: {
      name: "Demo Client",
      email: "demo-client@adplatform.local",
    },
  });

  console.log(`Created demo client. CLIENT_ID=${client.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
