// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed default models
    const models = [
      { name: "gpt-4o-mini", tags: ["Free"] },
      { name: "gpt-4o", tags: ["Premium"] },
      { name: "claude-3.5-sonnet", tags: ["Premium"] },
    ];

    for (const model of models) {
      await prisma.model.upsert({
        where: { name: model.name },
        update: {},
        create: {
          name: model.name,
          tags: model.tags,
        },
      });
    }

    console.log("Default models have been seeded");

    // Add any other seeding operations here
    // For example, seeding test users or other necessary data
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
