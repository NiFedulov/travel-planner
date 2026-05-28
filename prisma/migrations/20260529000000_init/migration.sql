-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "travelers" TEXT NOT NULL,
    "vacationStyle" TEXT NOT NULL DEFAULT '[]',
    "travelPace" TEXT NOT NULL DEFAULT 'moderate',
    "flightClass" TEXT NOT NULL DEFAULT 'economy',
    "maxLayovers" INTEGER NOT NULL DEFAULT 1,
    "health" TEXT NOT NULL DEFAULT '{}',
    "accommodation" TEXT NOT NULL DEFAULT '{}',
    "passports" TEXT NOT NULL DEFAULT '[]',
    "existingVisas" TEXT NOT NULL DEFAULT '[]',
    "existingETAs" TEXT NOT NULL DEFAULT '[]',
    "hasIsraeliStamps" BOOLEAN NOT NULL DEFAULT false,
    "criminalRecord" BOOLEAN NOT NULL DEFAULT false,
    "travelInsurance" BOOLEAN NOT NULL DEFAULT false,
    "budgetTotal" DOUBLE PRECISION,
    "budgetCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "budgetBreakdown" TEXT,
    "cuisinePreferences" TEXT NOT NULL DEFAULT '[]',
    "languagesSpoken" TEXT NOT NULL DEFAULT '[]',
    "loyaltyPrograms" TEXT NOT NULL DEFAULT '[]',
    "visitedCountries" TEXT NOT NULL DEFAULT '[]',
    "favoriteDestinations" TEXT NOT NULL DEFAULT '[]',
    "minorsTraveling" TEXT,
    "preferredAirlines" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originCity" TEXT NOT NULL,
    "originCode" TEXT NOT NULL,
    "destinations" TEXT NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "datesFlexible" BOOLEAN NOT NULL DEFAULT false,
    "visaRequirements" TEXT,
    "vaccinationReqs" TEXT,
    "entryRestrictions" TEXT,
    "selectedRoute" TEXT,
    "selectedAccommodations" TEXT,
    "selectedCarRental" TEXT,
    "aiRecommendations" TEXT,
    "estimatedTotal" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockFlight" (
    "id" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "fromCity" TEXT NOT NULL,
    "fromCountry" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "toCity" TEXT NOT NULL,
    "toCountry" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "layoverCode" TEXT,
    "layoverCity" TEXT,
    "layoverCountry" TEXT,
    "layoverMin" INTEGER,
    "transitVisa" BOOLEAN NOT NULL DEFAULT false,
    "priceEconomy" DOUBLE PRECISION NOT NULL,
    "priceBusiness" DOUBLE PRECISION NOT NULL,
    "priceFirst" DOUBLE PRECISION NOT NULL,
    "seatsLeft" INTEGER NOT NULL DEFAULT 50,
    "isStopover" BOOLEAN NOT NULL DEFAULT false,
    "stopoverNights" INTEGER,

    CONSTRAINT "MockFlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockHotel" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "petFriendly" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccess" BOOLEAN NOT NULL DEFAULT false,
    "breakfastIncl" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "pool" BOOLEAN NOT NULL DEFAULT false,
    "gym" BOOLEAN NOT NULL DEFAULT false,
    "wifi" BOOLEAN NOT NULL DEFAULT true,
    "distanceCenter" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "reviewCount" INTEGER NOT NULL,
    "imageSlug" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "MockHotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectedService" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "username" TEXT,
    "membershipId" TEXT,
    "membershipLevel" TEXT,
    "historyPasted" TEXT,
    "aiInsights" TEXT,
    "analysisStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "properties" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockCar" (
    "id" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "automatic" BOOLEAN NOT NULL DEFAULT true,
    "pricePerDay" DOUBLE PRECISION NOT NULL,
    "crossBorderAllowed" BOOLEAN NOT NULL DEFAULT true,
    "crossBorderFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unlimitedMiles" BOOLEAN NOT NULL DEFAULT true,
    "deposit" DOUBLE PRECISION NOT NULL,
    "minAge" INTEGER NOT NULL DEFAULT 21,
    "airportPickup" BOOLEAN NOT NULL DEFAULT true,
    "imageSlug" TEXT NOT NULL,

    CONSTRAINT "MockCar_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "ConnectedService_userId_idx" ON "ConnectedService"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedService_userId_provider_key" ON "ConnectedService"("userId", "provider");

-- CreateIndex
CREATE INDEX "Event_event_idx" ON "Event"("event");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConnectedService" ADD CONSTRAINT "ConnectedService_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
