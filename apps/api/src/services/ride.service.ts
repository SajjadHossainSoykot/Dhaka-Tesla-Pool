import { calculateFare } from "../domain/fare.js";
import { canPassengerCancel } from "../domain/lifecycle.js";
import type { Zone } from "../domain/zones.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { assignRequestToPool } from "./pooling.service.js";

export async function createRideRequest(input: {
  passengerId: string;
  pickupZone: Zone;
  destinationZone: Zone;
  seats: number;
  paymentMethod: "CASH" | "TESLAPAY";
}) {
  if (input.pickupZone === input.destinationZone) {
    throw new AppError(400, "Pickup and destination must be different", "SAME_ZONE");
  }

  const activeRide = await prisma.rideRequest.findFirst({
    where: {
      passengerId: input.passengerId,
      status: { in: ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"] },
    },
  });
  if (activeRide) {
    throw new AppError(409, "Complete or cancel your active ride first", "ACTIVE_RIDE_EXISTS");
  }

  const soloFare = calculateFare({
    pickupZone: input.pickupZone,
    destinationZone: input.destinationZone,
    seats: input.seats,
    pooled: false,
  });

  const request = await prisma.rideRequest.create({
    data: {
      passengerId: input.passengerId,
      pickupZone: input.pickupZone,
      destinationZone: input.destinationZone,
      seats: input.seats,
      soloFarePoysha: soloFare.totalPoysha,
      finalFarePoysha: soloFare.totalPoysha,
      paymentMethod: input.paymentMethod,
      statusHistory: {
        create: {
          fromStatus: null,
          toStatus: "REQUESTED",
          actorUserId: input.passengerId,
          note: "Passenger requested a ride",
        },
      },
    },
  });

  try {
    await assignRequestToPool(request);
  } catch (error) {
    await prisma.rideRequest.delete({ where: { id: request.id } });
    throw error;
  }

  return getRideForPassenger(input.passengerId, request.id);
}

export async function getPassengerRides(passengerId: string) {
  const rides = await prisma.rideRequest.findMany({
    where: { passengerId },
    include: {
      poolMember: {
        include: {
          pool: {
            include: {
              vehicle: { include: { driver: true } },
              members: { include: { rideRequest: true } },
            },
          },
        },
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rides.map(toPassengerRideDto);
}

export async function getRideForPassenger(passengerId: string, rideId: string) {
  const ride = await prisma.rideRequest.findFirst({
    where: { id: rideId, passengerId },
    include: {
      poolMember: {
        include: {
          pool: {
            include: {
              vehicle: { include: { driver: true } },
              members: { include: { rideRequest: true } },
            },
          },
        },
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ride) throw new AppError(404, "Ride not found", "RIDE_NOT_FOUND");
  return toPassengerRideDto(ride);
}

export async function cancelPassengerRide(passengerId: string, rideId: string) {
  const ride = await prisma.rideRequest.findFirst({
    where: { id: rideId, passengerId },
    include: { poolMember: true },
  });
  if (!ride) throw new AppError(404, "Ride not found", "RIDE_NOT_FOUND");
  if (!canPassengerCancel(ride.status)) {
    throw new AppError(409, `Ride cannot be cancelled from ${ride.status}`, "CANCELLATION_NOT_ALLOWED");
  }

  await prisma.$transaction(async (tx) => {
    await tx.rideRequest.update({
      where: { id: ride.id },
      data: { status: "CANCELLED" },
    });
    await tx.rideStatusHistory.create({
      data: {
        rideRequestId: ride.id,
        fromStatus: ride.status,
        toStatus: "CANCELLED",
        actorUserId: passengerId,
        note: "Passenger cancelled before trip start",
      },
    });

    if (!ride.poolMember) return;

    await tx.pool.update({
      where: { id: ride.poolMember.poolId },
      data: { reservedSeats: { decrement: ride.seats } },
    });

    const members = await tx.poolMember.findMany({
      where: { poolId: ride.poolMember.poolId },
      include: { rideRequest: true },
    });
    const active = members.filter((member) => member.rideRequest.id !== ride.id && member.rideRequest.status !== "CANCELLED");

    if (active.length === 0) {
      const pool = await tx.pool.findUniqueOrThrow({ where: { id: ride.poolMember.poolId } });
      if (!["COMPLETED", "CANCELLED"].includes(pool.status)) {
        await tx.pool.update({ where: { id: pool.id }, data: { status: "CANCELLED" } });
        await tx.poolStatusHistory.create({
          data: {
            poolId: pool.id,
            fromStatus: pool.status,
            toStatus: "CANCELLED",
            actorUserId: passengerId,
            note: "Last active passenger cancelled",
          },
        });
      }
      return;
    }

    const pooled = active.length > 1;
    for (const member of active) {
      const fare = calculateFare({
        pickupZone: member.rideRequest.pickupZone as Zone,
        destinationZone: member.rideRequest.destinationZone as Zone,
        seats: member.seats,
        pooled,
      });
      await tx.poolMember.update({ where: { id: member.id }, data: { farePoysha: fare.totalPoysha } });
      await tx.rideRequest.update({
        where: { id: member.rideRequestId },
        data: { finalFarePoysha: fare.totalPoysha },
      });
    }
  });

  return getRideForPassenger(passengerId, rideId);
}

function toPassengerRideDto(ride: any) {
  const pool = ride.poolMember?.pool;
  const activeMembers = pool?.members?.filter((member: any) => member.rideRequest.status !== "CANCELLED") ?? [];

  return {
    id: ride.id,
    pickupZone: ride.pickupZone,
    destinationZone: ride.destinationZone,
    seats: ride.seats,
    status: ride.status,
    paymentMethod: ride.paymentMethod,
    soloFarePoysha: ride.soloFarePoysha,
    farePoysha: ride.finalFarePoysha,
    isPooled: activeMembers.length > 1,
    sharedWithCount: Math.max(0, activeMembers.length - 1),
    poolId: pool?.id ?? null,
    vehicle: pool
      ? { name: pool.vehicle.name, driverName: pool.vehicle.driver.name }
      : null,
    history: ride.statusHistory.map((item: any) => ({
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      note: item.note,
      createdAt: item.createdAt,
    })),
    createdAt: ride.createdAt,
    updatedAt: ride.updatedAt,
  };
}
