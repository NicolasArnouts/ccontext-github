/*
  Warnings:

  - Added the required column `initialTokens` to the `Model` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resetTokens` to the `Model` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Model" ADD COLUMN     "initialTokens" INTEGER NOT NULL,
ADD COLUMN     "resetTokens" INTEGER NOT NULL;
