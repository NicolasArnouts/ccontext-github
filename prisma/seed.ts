// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed default models
    const models = [
      { name: "gpt-4o-mini", tags: ["Free"], pricePerMillionTokens: 0.6 },
      { name: "gpt-4o", tags: ["Premium"], pricePerMillionTokens: 7 },
      {
        name: "claude-3.5-sonnet",
        tags: ["Premium"],
        pricePerMillionTokens: 5,
      },
    ];

    for (const model of models) {
      await prisma.model.upsert({
        where: { name: model.name },
        update: { pricePerMillionTokens: model.pricePerMillionTokens },
        create: {
          name: model.name,
          tags: model.tags,
          pricePerMillionTokens: model.pricePerMillionTokens,
        },
      });
    }

    console.log("Default models have been seeded");

    // Add any other seeding operations here
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
