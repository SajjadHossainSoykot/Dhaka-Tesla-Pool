CREATE TYPE "Role" AS ENUM ('PASSENGER', 'DRIVER');
CREATE TYPE "RideStatus" AS ENUM ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TESLAPAY');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "plateLabel" TEXT NOT NULL,
  "capacity" INTEGER NOT NULL DEFAULT 3,
  "isOnline" BOOLEAN NOT NULL DEFAULT false,
  "driverId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Vehicle_capacity_check" CHECK ("capacity" > 0)
);

CREATE TABLE "RideRequest" (
  "id" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,
  "pickupZone" TEXT NOT NULL,
  "destinationZone" TEXT NOT NULL,
  "seats" INTEGER NOT NULL,
  "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
  "soloFarePoysha" INTEGER NOT NULL,
  "finalFarePoysha" INTEGER NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RideRequest_seats_check" CHECK ("seats" > 0),
  CONSTRAINT "RideRequest_solo_fare_check" CHECK ("soloFarePoysha" >= 0),
  CONSTRAINT "RideRequest_final_fare_check" CHECK ("finalFarePoysha" >= 0)
);

CREATE TABLE "Pool" (
  "id" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "pickupZone" TEXT NOT NULL,
  "routeCorridor" TEXT NOT NULL,
  "status" "RideStatus" NOT NULL DEFAULT 'REQUESTED',
  "capacitySnapshot" INTEGER NOT NULL,
  "reservedSeats" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pool_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Pool_capacity_check" CHECK ("capacitySnapshot" > 0),
  CONSTRAINT "Pool_reserved_seats_check" CHECK ("reservedSeats" >= 0 AND "reservedSeats" <= "capacitySnapshot")
);

CREATE TABLE "PoolMember" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "rideRequestId" TEXT NOT NULL,
  "passengerId" TEXT NOT NULL,
  "seats" INTEGER NOT NULL,
  "farePoysha" INTEGER NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoolMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PoolMember_seats_check" CHECK ("seats" > 0),
  CONSTRAINT "PoolMember_fare_check" CHECK ("farePoysha" >= 0)
);

CREATE TABLE "RideStatusHistory" (
  "id" TEXT NOT NULL,
  "rideRequestId" TEXT NOT NULL,
  "fromStatus" "RideStatus",
  "toStatus" "RideStatus" NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RideStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PoolStatusHistory" (
  "id" TEXT NOT NULL,
  "poolId" TEXT NOT NULL,
  "fromStatus" "RideStatus",
  "toStatus" "RideStatus" NOT NULL,
  "actorUserId" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoolStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Vehicle_plateLabel_key" ON "Vehicle"("plateLabel");
CREATE UNIQUE INDEX "Vehicle_driverId_key" ON "Vehicle"("driverId");
CREATE UNIQUE INDEX "PoolMember_rideRequestId_key" ON "PoolMember"("rideRequestId");
CREATE INDEX "RideRequest_passengerId_createdAt_idx" ON "RideRequest"("passengerId", "createdAt");
CREATE INDEX "RideRequest_status_pickupZone_idx" ON "RideRequest"("status", "pickupZone");
CREATE INDEX "Pool_vehicleId_status_idx" ON "Pool"("vehicleId", "status");
CREATE INDEX "Pool_pickupZone_routeCorridor_status_idx" ON "Pool"("pickupZone", "routeCorridor", "status");
CREATE INDEX "PoolMember_poolId_joinedAt_idx" ON "PoolMember"("poolId", "joinedAt");
CREATE INDEX "PoolMember_passengerId_joinedAt_idx" ON "PoolMember"("passengerId", "joinedAt");
CREATE INDEX "RideStatusHistory_rideRequestId_createdAt_idx" ON "RideStatusHistory"("rideRequestId", "createdAt");
CREATE INDEX "PoolStatusHistory_poolId_createdAt_idx" ON "PoolStatusHistory"("poolId", "createdAt");

ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RideRequest" ADD CONSTRAINT "RideRequest_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Pool" ADD CONSTRAINT "Pool_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_rideRequestId_fkey" FOREIGN KEY ("rideRequestId") REFERENCES "RideRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoolMember" ADD CONSTRAINT "PoolMember_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RideStatusHistory" ADD CONSTRAINT "RideStatusHistory_rideRequestId_fkey" FOREIGN KEY ("rideRequestId") REFERENCES "RideRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RideStatusHistory" ADD CONSTRAINT "RideStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PoolStatusHistory" ADD CONSTRAINT "PoolStatusHistory_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "Pool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PoolStatusHistory" ADD CONSTRAINT "PoolStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
