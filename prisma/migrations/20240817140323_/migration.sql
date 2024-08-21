-- CreateTable
CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tags" TEXT[],

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "tokensLeft" INTEGER NOT NULL,
    "resetTimestamp" TIMESTAMP(3),
    "lastRequestTime" TIMESTAMP(3),

    CONSTRAINT "UserTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Model_name_key" ON "Model"("name");

-- CreateIndex
CREATE INDEX "UserTokens_userId_idx" ON "UserTokens"("userId");

-- CreateIndex
CREATE INDEX "UserTokens_modelId_idx" ON "UserTokens"("modelId");

-- CreateIndex
CREATE UNIQUE INDEX "UserTokens_userId_modelId_key" ON "UserTokens"("userId", "modelId");
