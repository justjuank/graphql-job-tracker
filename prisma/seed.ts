import { createPrismaClient } from "../src/db.js";
import { seedDatabase } from "../src/seed.js";

const prisma = createPrismaClient();

try {
  await seedDatabase(prisma);
  console.log("Database seeded.");
} finally {
  await prisma.$disconnect();
}
