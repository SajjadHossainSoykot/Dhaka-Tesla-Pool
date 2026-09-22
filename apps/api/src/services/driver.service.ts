import { assertTransition, type RideStatus } from "../domain/lifecycle.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const ACTION_TO_STATUS = {
  ACCEPT: "MATCHED",
  ARRIVE: "DRIVER_ARRIVED",
  START: "STARTED",
  COMPLETE: "COMPLETED",
} as const;

export type DriverPoolAction = keyof typeof ACTION_TO_STATUS;

export async function getDriverVehicle(driverId: string) {
  const vehicle = await prisma.vehicle.findUnique({ where: { driverId } });
  if (!vehicle) throw new AppError(404, "Driver vehicle not found", "VEHICLE_NOT_FOUND");
  return vehicle;
}

export async function setDriverOnline(driverId: string, isOnline: boolean) {
  const vehicle = await getDriverVehicle(driverId);

  if (!isOnline) {
    const active = await prisma.pool.findFirst({
      where: {
        vehicleId: vehicle.id,
        status: { in: ["MATCHED", "DRIVER_ARRIVED", "STARTED"] },
      },
    });
    if (active) {
      throw new AppError(409, "Finish the active pool before going offline", "ACTIVE_POOL_EXISTS");
    }
  }

  return prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { isOnline },
  });
}

export async function getDriverPools(driverId: string) {
  const vehicle = await getDriverVehicle(driverId);
  const pools = await prisma.pool.findMany({
    where: { vehicleId: vehicle.id },
    include: {
      members: {
        include: {
          passenger: { select: { id: true, name: true } },
          rideRequest: true,
        },
        orderBy: { joinedAt: "asc" },
      },
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return pools.map((pool) => ({
    id: pool.id,
    status: pool.status,
    pickupZone: pool.pickupZone,
    routeCorridor: pool.routeCorridor,
    capacity: pool.capacitySnapshot,
    reservedSeats: pool.reservedSeats,
    availableSeats: pool.capacitySnapshot - pool.reservedSeats,
    createdAt: pool.createdAt,
    members: pool.members
      .filter((member) => member.rideRequest.status !== "CANCELLED")
      .map((member) => ({
        rideId: member.rideRequestId,
        passenger: member.passenger,
        pickupZone: member.rideRequest.pickupZone,
        destinationZone: member.rideRequest.destinationZone,
        seats: member.seats,
        farePoysha: member.farePoysha,
        paymentMethod: member.rideRequest.paymentMethod,
        status: member.rideRequest.status,
      })),
    history: pool.statusHistory.map((item) => ({
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      note: item.note,
      createdAt: item.createdAt,
    })),
  }));
}

export async function transitionDriverPool(
  driverId: string,
  poolId: string,
  action: DriverPoolAction,
) {
  const vehicle = await getDriverVehicle(driverId);
  const pool = await prisma.pool.findFirst({
    where: { id: poolId, vehicleId: vehicle.id },
    include: { members: { include: { rideRequest: true } } },
  });
  if (!pool) throw new AppError(404, "Pool not found", "POOL_NOT_FOUND");

  const target = ACTION_TO_STATUS[action] as RideStatus;
  try {
    assertTransition(pool.status as RideStatus, target);
  } catch {
    throw new AppError(
      409,
      `Cannot ${action.toLowerCase()} a pool in ${pool.status}`,
      "INVALID_POOL_TRANSITION",
    );
  }

  const activeMembers = pool.members.filter((member) => member.rideRequest.status !== "CANCELLED");
  if (activeMembers.length === 0) {
    throw new AppError(409, "Pool has no active passengers", "EMPTY_POOL");
  }

  if (action === "ACCEPT") {
    if (!vehicle.isOnline) {
      throw new AppError(409, "Go online before accepting a pool", "DRIVER_OFFLINE");
    }
    const anotherActivePool = await prisma.pool.findFirst({
      where: {
        vehicleId: vehicle.id,
        id: { not: pool.id },
        status: { in: ["MATCHED", "DRIVER_ARRIVED", "STARTED"] },
      },
    });
    if (anotherActivePool) {
      throw new AppError(409, "Complete the active pool before accepting another", "ACTIVE_POOL_EXISTS");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.pool.update({ where: { id: pool.id }, data: { status: target } });
    await tx.poolStatusHistory.create({
      data: {
        poolId: pool.id,
        fromStatus: pool.status,
        toStatus: target,
        actorUserId: driverId,
        note: `Driver action: ${action}`,
      },
    });

    for (const member of activeMembers) {
      const current = member.rideRequest.status as RideStatus;
      if (current === target) continue;
      try {
        assertTransition(current, target);
      } catch {
        throw new AppError(
          409,
          `Passenger ride ${member.rideRequestId} cannot move ${current} -> ${target}`,
          "PASSENGER_STATE_MISMATCH",
        );
      }

      await tx.rideRequest.update({
        where: { id: member.rideRequestId },
        data: { status: target },
      });
      await tx.rideStatusHistory.create({
        data: {
          rideRequestId: member.rideRequestId,
          fromStatus: current,
          toStatus: target,
          actorUserId: driverId,
          note: `Pool ${pool.id}: driver action ${action}`,
        },
      });
    }
  });

  const pools = await getDriverPools(driverId);
  return pools.find((item) => item.id === poolId)!;
}
