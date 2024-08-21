/*
  Warnings:

  - Added the required column `ipAddress` to the `AnonymousSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AnonymousSession" ADD COLUMN     "ipAddress" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "AnonymousSession_ipAddress_idx" ON "AnonymousSession"("ipAddress");
