import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import { routeCorridor } from "../../src/domain/zones.js";
import { prisma } from "../../src/lib/prisma.js";
import { joinPoolAtomically } from "../../src/services/pooling.service.js";

const PASSWORD = "Demo123!";

async function resetDatabase() {
  await prisma.poolStatusHistory.deleteMany();
  await prisma.rideStatusHistory.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
}

async function seedCast() {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const jashim = await prisma.user.create({
    data: { name: "Jashim", email: "jashim@test.dev", passwordHash, role: "DRIVER" },
  });
  const nusrat = await prisma.user.create({
    data: { name: "Nusrat", email: "nusrat@test.dev", passwordHash, role: "PASSENGER" },
  });
  const rafiq = await prisma.user.create({
    data: { name: "Rafiq", email: "rafiq@test.dev", passwordHash, role: "PASSENGER" },
  });
  const shirin = await prisma.user.create({
    data: { name: "Shirin", email: "shirin@test.dev", passwordHash, role: "PASSENGER" },
  });
  const vehicle = await prisma.vehicle.create({
    data: {
      name: "Bullet",
      plateLabel: "TEST-BULLET",
      capacity: 3,
      isOnline: true,
      driverId: jashim.id,
    },
  });
  return { jashim, nusrat, rafiq, shirin, vehicle };
}

async function login(email: string) {
  const response = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  expect(response.status).toBe(200);
  return response.body.token as string;
}

function bearer(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(async () => {
  await resetDatabase();
  await seedCast();
});

describe("acceptance-critical ride behavior", () => {
  it("pools Nusrat and Rafiq, applies individual fares, and restores solo fare after cancellation", async () => {
    const nusratToken = await login("nusrat@test.dev");
    const rafiqToken = await login("rafiq@test.dev");

    const first = await request(app)
      .post("/api/rides")
      .set(bearer(nusratToken))
      .send({ pickupZone: "BANANI", destinationZone: "MOHAKHALI", seats: 1, paymentMethod: "CASH" });
    expect(first.status).toBe(201);
    expect(first.body.ride.farePoysha).toBe(11_000);

    const second = await request(app)
      .post("/api/rides")
      .set(bearer(rafiqToken))
      .send({ pickupZone: "BANANI", destinationZone: "GULSHAN_1", seats: 1, paymentMethod: "TESLAPAY" });
    expect(second.status).toBe(201);
    expect(second.body.ride.farePoysha).toBe(7_200);
    expect(second.body.ride.isPooled).toBe(true);

    const nusratAfterPool = await request(app)
      .get(`/api/rides/${first.body.ride.id}`)
      .set(bearer(nusratToken));
    expect(nusratAfterPool.body.ride.farePoysha).toBe(8_800);
    expect(nusratAfterPool.body.ride.sharedWithCount).toBe(1);

    const cancel = await request(app)
      .post(`/api/rides/${second.body.ride.id}/cancel`)
      .set(bearer(rafiqToken));
    expect(cancel.status).toBe(200);

    const nusratSoloAgain = await request(app)
      .get(`/api/rides/${first.body.ride.id}`)
      .set(bearer(nusratToken));
    expect(nusratSoloAgain.body.ride.farePoysha).toBe(11_000);
    expect(nusratSoloAgain.body.ride.isPooled).toBe(false);
  });

  it("prevents one passenger from cancelling another passenger's ride", async () => {
    const nusratToken = await login("nusrat@test.dev");
    const rafiqToken = await login("rafiq@test.dev");
    const ride = await request(app)
      .post("/api/rides")
      .set(bearer(nusratToken))
      .send({ pickupZone: "BANANI", destinationZone: "MOHAKHALI", seats: 1, paymentMethod: "CASH" });

    const attack = await request(app)
      .post(`/api/rides/${ride.body.ride.id}/cancel`)
      .set(bearer(rafiqToken));

    expect(attack.status).toBe(404);
    expect(attack.body.error.code).toBe("RIDE_NOT_FOUND");
  });

  it("rejects invalid driver state transitions and passenger cancellation after start", async () => {
    const nusratToken = await login("nusrat@test.dev");
    const jashimToken = await login("jashim@test.dev");
    const ride = await request(app)
      .post("/api/rides")
      .set(bearer(nusratToken))
      .send({ pickupZone: "BANANI", destinationZone: "MOHAKHALI", seats: 1, paymentMethod: "CASH" });

    const pools = await request(app).get("/api/driver/pools").set(bearer(jashimToken));
    const poolId = pools.body.pools[0].id as string;

    const skip = await request(app)
      .post(`/api/driver/pools/${poolId}/transition`)
      .set(bearer(jashimToken))
      .send({ action: "START" });
    expect(skip.status).toBe(409);
    expect(skip.body.error.code).toBe("INVALID_POOL_TRANSITION");

    for (const action of ["ACCEPT", "ARRIVE", "START"]) {
      const response = await request(app)
        .post(`/api/driver/pools/${poolId}/transition`)
        .set(bearer(jashimToken))
        .send({ action });
      expect(response.status).toBe(200);
    }

    const lateCancel = await request(app)
      .post(`/api/rides/${ride.body.ride.id}/cancel`)
      .set(bearer(nusratToken));
    expect(lateCancel.status).toBe(409);
    expect(lateCancel.body.error.code).toBe("CANCELLATION_NOT_ALLOWED");
  });

  it("lets only one concurrent caller claim Bullet's final seat", async () => {
    const { nusrat, rafiq, shirin, vehicle } = await resetAndGetCast();

    const nusratRide = await prisma.rideRequest.create({
      data: {
        passengerId: nusrat.id,
        pickupZone: "BANANI",
        destinationZone: "MOHAKHALI",
        seats: 2,
        soloFarePoysha: 22_000,
        finalFarePoysha: 22_000,
      },
    });
    const pool = await prisma.pool.create({
      data: {
        vehicleId: vehicle.id,
        pickupZone: "BANANI",
        routeCorridor: routeCorridor("BANANI", "MOHAKHALI"),
        capacitySnapshot: 3,
        reservedSeats: 2,
      },
    });
    await prisma.poolMember.create({
      data: {
        poolId: pool.id,
        rideRequestId: nusratRide.id,
        passengerId: nusrat.id,
        seats: 2,
        farePoysha: 22_000,
      },
    });

    const [rafiqRide, shirinRide] = await Promise.all([
      prisma.rideRequest.create({
        data: {
          passengerId: rafiq.id,
          pickupZone: "BANANI",
          destinationZone: "GULSHAN_1",
          seats: 1,
          soloFarePoysha: 9_000,
          finalFarePoysha: 9_000,
        },
      }),
      prisma.rideRequest.create({
        data: {
          passengerId: shirin.id,
          pickupZone: "BANANI",
          destinationZone: "GULSHAN_2",
          seats: 1,
          soloFarePoysha: 11_000,
          finalFarePoysha: 11_000,
        },
      }),
    ]);

    const results = await Promise.allSettled([
      joinPoolAtomically({ poolId: pool.id, rideRequestId: rafiqRide.id, passengerId: rafiq.id, seats: 1 }),
      joinPoolAtomically({ poolId: pool.id, rideRequestId: shirinRide.id, passengerId: shirin.id, seats: 1 }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const after = await prisma.pool.findUniqueOrThrow({ where: { id: pool.id }, include: { members: true } });
    expect(after.reservedSeats).toBe(3);
    expect(after.members).toHaveLength(2);
  });
});

async function resetAndGetCast() {
  await resetDatabase();
  return seedCast();
}
