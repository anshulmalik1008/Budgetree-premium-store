/*
  Warnings:

  - Made the column `productsUrl` on table `ExternalApi` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ExternalApi" ADD COLUMN     "apiKey" TEXT,
ALTER COLUMN "baseUrl" DROP NOT NULL,
ALTER COLUMN "productsUrl" SET NOT NULL;
