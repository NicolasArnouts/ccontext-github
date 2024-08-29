import prisma from "@/lib/prismadb";

export async function resetTokens() {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  try {
    const models = await prisma.model.findMany();

    for (const model of models) {
      await prisma.userTokens.updateMany({
        where: {
          modelId: model.id,
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
          tokensLeft: model.resetTokens,
          resetTimestamp: new Date(),
        },
      });
    }

    console.log("Tokens have been reset for eligible users");
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
