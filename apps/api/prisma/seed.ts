import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required for seed");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const DEMO_PASSWORD = "Demo123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const [jashim, nusrat, rafiq, shirin] = await Promise.all([
    prisma.user.upsert({
      where: { email: "jashim@dhakapool.dev" },
      update: { name: "Jashim", passwordHash, role: "DRIVER" },
      create: { name: "Jashim", email: "jashim@dhakapool.dev", passwordHash, role: "DRIVER" },
    }),
    prisma.user.upsert({
      where: { email: "nusrat@dhakapool.dev" },
      update: { name: "Nusrat", passwordHash, role: "PASSENGER" },
      create: { name: "Nusrat", email: "nusrat@dhakapool.dev", passwordHash, role: "PASSENGER" },
    }),
    prisma.user.upsert({
      where: { email: "rafiq@dhakapool.dev" },
      update: { name: "Rafiq", passwordHash, role: "PASSENGER" },
      create: { name: "Rafiq", email: "rafiq@dhakapool.dev", passwordHash, role: "PASSENGER" },
    }),
    prisma.user.upsert({
      where: { email: "shirin@dhakapool.dev" },
      update: { name: "Shirin", passwordHash, role: "PASSENGER" },
      create: { name: "Shirin", email: "shirin@dhakapool.dev", passwordHash, role: "PASSENGER" },
    }),
  ]);

  await prisma.vehicle.upsert({
    where: { driverId: jashim.id },
    update: { name: "Bullet", plateLabel: "DHAKA-BULLET-01", capacity: 3, isOnline: true },
    create: {
      name: "Bullet",
      plateLabel: "DHAKA-BULLET-01",
      capacity: 3,
      isOnline: true,
      driverId: jashim.id,
    },
  });

  console.info("Seeded demo cast:");
  console.info(`  Jashim (driver): jashim@dhakapool.dev / ${DEMO_PASSWORD}`);
  console.info(`  Nusrat:          nusrat@dhakapool.dev / ${DEMO_PASSWORD}`);
  console.info(`  Rafiq:           rafiq@dhakapool.dev / ${DEMO_PASSWORD}`);
  console.info(`  Shirin:          shirin@dhakapool.dev / ${DEMO_PASSWORD}`);
  console.info(`  Vehicle:         Bullet (3 seats)`);

  void nusrat;
  void rafiq;
  void shirin;
}

main()
  .finally(async () => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
