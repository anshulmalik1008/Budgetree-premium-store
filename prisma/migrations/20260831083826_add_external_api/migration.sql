/*
  Warnings:

  - You are about to drop the column `apiKey` on the `ExternalApi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ExternalApi" DROP COLUMN "apiKey",
ALTER COLUMN "productsUrl" DROP NOT NULL;
