-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "description" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "billingEmail" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "monthlyBudget" REAL NOT NULL DEFAULT 50,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SponsoredEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "placementType" TEXT NOT NULL DEFAULT 'featured',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SponsoredEvent_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SponsoredEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SponsorAnalytic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sponsorId" TEXT NOT NULL,
    "eventId" TEXT,
    "metric" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SponsorAnalytic_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_email_key" ON "Sponsor"("email");

-- CreateIndex
CREATE INDEX "Sponsor_tier_idx" ON "Sponsor"("tier");

-- CreateIndex
CREATE INDEX "Sponsor_isActive_idx" ON "Sponsor"("isActive");

-- CreateIndex
CREATE INDEX "SponsoredEvent_eventId_idx" ON "SponsoredEvent"("eventId");

-- CreateIndex
CREATE INDEX "SponsoredEvent_sponsorId_idx" ON "SponsoredEvent"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsoredEvent_isActive_idx" ON "SponsoredEvent"("isActive");

-- CreateIndex
CREATE INDEX "SponsoredEvent_priority_idx" ON "SponsoredEvent"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SponsoredEvent_sponsorId_eventId_key" ON "SponsoredEvent"("sponsorId", "eventId");

-- CreateIndex
CREATE INDEX "SponsorAnalytic_sponsorId_idx" ON "SponsorAnalytic"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorAnalytic_eventId_idx" ON "SponsorAnalytic"("eventId");

-- CreateIndex
CREATE INDEX "SponsorAnalytic_metric_idx" ON "SponsorAnalytic"("metric");

-- CreateIndex
CREATE INDEX "SponsorAnalytic_createdAt_idx" ON "SponsorAnalytic"("createdAt");
