import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Add any initial data seeding here
    // For example:
    // await prisma.repository.create({
    //   data: {
    //     name: "Example Repository",
    //     url: "https://github.com/example/repo",
    //     userId: "example-user-id",
    //   },
    // });

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();