/*
  Warnings:

  - Added the required column `order` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "order" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_order_idx" ON "ChatMessage"("sessionId", "order");
