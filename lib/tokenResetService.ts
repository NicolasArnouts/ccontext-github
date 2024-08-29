// lib/tokenResetService.ts
import prisma from "@/lib/prismadb";

export async function resetTokens() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const DEFAULT_RESET_USER_TOKENS = 100_000;

  try {
    const freeModels = await prisma.model.findMany({
      where: {
        tags: {
          has: "Free",
        },
      },
    });

    const freeModelIds = freeModels.map((model) => model.id);

    const result = await prisma.userTokens.updateMany({
      where: {
        modelId: {
          in: freeModelIds,
        },
        AND: [
          {
            OR: [
              { resetTimestamp: { lt: fourHoursAgo } },
              { resetTimestamp: null },
            ],
          },
          { lastRequestTime: { lt: fourHoursAgo } },
        ],
      },
      data: {
        tokensLeft: DEFAULT_RESET_USER_TOKENS,
        resetTimestamp: new Date(),
      },
    });

    console.log(`Reset tokens for ${result.count} users`);
  } catch (error) {
    console.error("Error resetting tokens:", error);
  }
}

if (require.main === module) {
  resetTokens()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
