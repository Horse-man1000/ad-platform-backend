-- CreateTable
CREATE TABLE "AdMetric" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER,
    "clicks" INTEGER,
    "spend" DECIMAL(18,6),
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdMetric_adId_date_key" ON "AdMetric"("adId", "date");

-- AddForeignKey
ALTER TABLE "AdMetric" ADD CONSTRAINT "AdMetric_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
