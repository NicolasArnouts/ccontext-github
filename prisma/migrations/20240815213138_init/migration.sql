/*
  Warnings:

  - The primary key for the `Repository` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Repository` table. All the data in the column will be lost.
  - Added the required column `slug` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Repository" DROP CONSTRAINT "Repository_pkey",
DROP COLUMN "id",
ADD COLUMN     "slug" TEXT NOT NULL,
ADD CONSTRAINT "Repository_pkey" PRIMARY KEY ("slug");

-- CreateIndex
CREATE INDEX "Repository_slug_idx" ON "Repository"("slug");
