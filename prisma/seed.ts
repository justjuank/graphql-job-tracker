import { createPrismaClient } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Demo seeding is disabled in production. Create accounts through the register mutation.",
  );
}

const prisma = createPrismaClient();

try {
  await seedDatabase(prisma);
  console.log("Local demo database seeded.");
} finally {
  await prisma.$disconnect();
}
