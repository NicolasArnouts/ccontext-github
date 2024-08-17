/*
  Warnings:

  - You are about to drop the column `chatCount` on the `AnonymousSession` table. All the data in the column will be lost.
  - You are about to drop the column `tokenUsage` on the `AnonymousSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[anonymousSessionId,modelId]` on the table `UserTokens` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AnonymousSession" DROP COLUMN "chatCount",
DROP COLUMN "tokenUsage";

-- AlterTable
ALTER TABLE "UserTokens" ADD COLUMN     "anonymousSessionId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "UserTokens_anonymousSessionId_idx" ON "UserTokens"("anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTokens_anonymousSessionId_modelId_key" ON "UserTokens"("anonymousSessionId", "modelId");
