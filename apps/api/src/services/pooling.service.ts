import { calculateFare } from "../domain/fare.js";
import { areRoutesCompatible, routeCorridor, type Zone } from "../domain/zones.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

class SeatReservationConflict extends Error {}

type PoolableRequest = {
  id: string;
  passengerId: string;
  pickupZone: string;
  destinationZone: string;
  seats: number;
};

async function recalculatePoolFares(tx: any, poolId: string): Promise<void> {
  const members = await tx.poolMember.findMany({
    where: { poolId },
    include: { rideRequest: true },
  });

  const activeMembers = members.filter(
    (member: any) => member.rideRequest.status !== "CANCELLED",
  );
  const pooled = activeMembers.length > 1;

  for (const member of activeMembers) {
    const fare = calculateFare({
      pickupZone: member.rideRequest.pickupZone as Zone,
      destinationZone: member.rideRequest.destinationZone as Zone,
      seats: member.seats,
      pooled,
    });

    await tx.poolMember.update({
      where: { id: member.id },
      data: { farePoysha: fare.totalPoysha },
    });
    await tx.rideRequest.update({
      where: { id: member.rideRequestId },
      data: { finalFarePoysha: fare.totalPoysha },
    });
  }
}

export async function joinPoolAtomically(input: {
  poolId: string;
  rideRequestId: string;
  passengerId: string;
  seats: number;
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const [pool, rideRequest] = await Promise.all([
      tx.pool.findUnique({ where: { id: input.poolId } }),
      tx.rideRequest.findUnique({ where: { id: input.rideRequestId } }),
    ]);

    if (!pool || !rideRequest) {
      throw new AppError(404, "Pool or ride request not found", "POOL_OR_RIDE_NOT_FOUND");
    }

    if (!["REQUESTED", "MATCHED"].includes(pool.status)) {
      throw new AppError(409, "Pool is no longer accepting passengers", "POOL_CLOSED");
    }

    if (
      !areRoutesCompatible(
        pool.pickupZone as Zone,
        rideRequest.destinationZone as Zone,
        rideRequest.pickupZone as Zone,
        rideRequest.destinationZone as Zone,
      )
    ) {
      // The first destination is not stored on Pool; routeCorridor below is the authoritative coarse check.
      const requestCorridor = routeCorridor(
        rideRequest.pickupZone as Zone,
        rideRequest.destinationZone as Zone,
      );
      if (requestCorridor !== pool.routeCorridor) {
        throw new AppError(409, "Ride route is not compatible with this pool", "ROUTE_NOT_COMPATIBLE");
      }
    }

    const reservation = await tx.pool.updateMany({
      where: {
        id: pool.id,
        status: { in: ["REQUESTED", "MATCHED"] },
        reservedSeats: { lte: pool.capacitySnapshot - input.seats },
      },
      data: { reservedSeats: { increment: input.seats } },
    });

    if (reservation.count !== 1) throw new SeatReservationConflict();

    const currentPool = await tx.pool.findUniqueOrThrow({ where: { id: pool.id } });
    await tx.poolMember.create({
      data: {
        poolId: pool.id,
        rideRequestId: rideRequest.id,
        passengerId: input.passengerId,
        seats: input.seats,
        farePoysha: rideRequest.soloFarePoysha,
      },
    });

    if (currentPool.status === "MATCHED") {
      await tx.rideRequest.update({
        where: { id: rideRequest.id },
        data: { status: "MATCHED" },
      });
      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: rideRequest.id,
          fromStatus: "REQUESTED",
          toStatus: "MATCHED",
          note: "Joined an already accepted compatible pool",
        },
      });
    }

    await recalculatePoolFares(tx, pool.id);
  });
}

export async function assignRequestToPool(request: PoolableRequest): Promise<string> {
  const candidates = await prisma.pool.findMany({
    where: {
      status: { in: ["REQUESTED", "MATCHED"] },
      vehicle: { isOnline: true },
    },
    include: {
      members: { include: { rideRequest: true } },
      vehicle: true,
    },
    orderBy: { createdAt: "asc" },
  });

  for (const pool of candidates) {
    const firstActiveMember = pool.members.find(
      (member) => member.rideRequest.status !== "CANCELLED",
    );
    if (!firstActiveMember) continue;

    const compatible = areRoutesCompatible(
      firstActiveMember.rideRequest.pickupZone as Zone,
      firstActiveMember.rideRequest.destinationZone as Zone,
      request.pickupZone as Zone,
      request.destinationZone as Zone,
    );
    if (!compatible) continue;

    try {
      await joinPoolAtomically({
        poolId: pool.id,
        rideRequestId: request.id,
        passengerId: request.passengerId,
        seats: request.seats,
      });
      return pool.id;
    } catch (error) {
      if (error instanceof SeatReservationConflict) continue;
      if (error instanceof AppError && ["POOL_CLOSED", "ROUTE_NOT_COMPATIBLE"].includes(error.code)) {
        continue;
      }
      throw error;
    }
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { isOnline: true, capacity: { gte: request.seats } },
    orderBy: { createdAt: "asc" },
  });
  if (!vehicle) {
    throw new AppError(409, "No online Tesla currently has enough seats", "NO_AVAILABLE_TESLA");
  }

  const pool = await prisma.$transaction(async (tx) => {
    const created = await tx.pool.create({
      data: {
        vehicleId: vehicle.id,
        pickupZone: request.pickupZone,
        routeCorridor: routeCorridor(request.pickupZone as Zone, request.destinationZone as Zone),
        capacitySnapshot: vehicle.capacity,
        reservedSeats: request.seats,
      },
    });

    const ride = await tx.rideRequest.findUniqueOrThrow({ where: { id: request.id } });
    await tx.poolMember.create({
      data: {
        poolId: created.id,
        rideRequestId: request.id,
        passengerId: request.passengerId,
        seats: request.seats,
        farePoysha: ride.soloFarePoysha,
      },
    });

    await tx.poolStatusHistory.create({
      data: {
        poolId: created.id,
        fromStatus: null,
        toStatus: "REQUESTED",
        note: "Candidate pool created for an online Tesla",
      },
    });

    return created;
  });

  return pool.id;
}

export async function recalculatePoolAfterMembershipChange(poolId: string): Promise<void> {
  await prisma.$transaction(async (tx) => recalculatePoolFares(tx, poolId));
}
