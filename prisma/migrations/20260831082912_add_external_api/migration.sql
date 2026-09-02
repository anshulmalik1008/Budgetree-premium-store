-- CreateTable
CREATE TABLE "ExternalApi" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "productsUrl" TEXT NOT NULL,
    "authType" TEXT NOT NULL DEFAULT 'NONE',
    "username" TEXT,
    "password" TEXT,
    "apiKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalApi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalApi_active_idx" ON "ExternalApi"("active");
