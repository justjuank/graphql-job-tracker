import type { DatabaseClient } from "./db.js";
import { hashPassword } from "./auth.js";

export async function clearDatabase(prisma: DatabaseClient) {
  await prisma.interview.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedDatabase(prisma: DatabaseClient) {
  await clearDatabase(prisma);

  await prisma.user.create({
    data: {
      id: "user-1",
      email: "demo@example.com",
      passwordHash: await hashPassword("portfolio-demo-password"),
      role: "ADMIN",
    },
  });

  await prisma.company.create({
    data: {
      id: "company-1",
      name: "Acme",
      applications: {
        create: {
          id: "application-1",
          role: "Backend Engineer",
          jobPostingUrl: "https://example.com/jobs/backend-engineer",
          status: "APPLIED",
          createdAt: new Date("2026-09-20T14:00:00.000Z"),
          userId: "user-1",
        },
      },
    },
  });

  await prisma.company.create({
    data: {
      id: "company-2",
      name: "Globex",
      applications: {
        create: {
          id: "application-2",
          role: "Platform Engineer",
          jobPostingUrl: "https://example.com/jobs/platform-engineer",
          status: "INTERVIEWING",
          createdAt: new Date("2026-09-22T16:30:00.000Z"),
          userId: "user-1",
          interviews: {
            create: {
              id: "interview-1",
              type: "TECHNICAL",
              scheduledAt: new Date("2026-09-28T15:00:00.000Z"),
            },
          },
        },
      },
    },
  });
}
