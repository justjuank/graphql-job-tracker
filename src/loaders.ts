import DataLoader from "dataloader";

import type {
  Company,
  Interview,
  JobApplication,
  User,
} from "../generated/prisma/client.js";
import type { DatabaseClient } from "./db.js";

export type BatchEvent = {
  loader: string;
  keys: readonly string[];
};

export type BatchObserver = (event: BatchEvent) => void;

export function createLoaders(
  prisma: DatabaseClient,
  userId: string,
  observeBatch?: BatchObserver,
) {
  const userById = new DataLoader<string, User | null>(async (ids) => {
    observeBatch?.({ loader: "userById", keys: ids });
    const requestedIds = ids.filter((id) => id === userId);
    const users = await prisma.user.findMany({
      where: { id: { in: [...requestedIds] } },
    });
    const usersById = new Map(users.map((user) => [user.id, user]));

    return ids.map((id) => usersById.get(id) ?? null);
  });

  const companyById = new DataLoader<string, Company | null>(async (ids) => {
    observeBatch?.({ loader: "companyById", keys: ids });

    const companies = await prisma.company.findMany({
      where: {
        id: { in: [...ids] },
        applications: { some: { userId } },
      },
    });
    const companiesById = new Map(companies.map((company) => [company.id, company]));

    return ids.map((id) => companiesById.get(id) ?? null);
  });

  const applicationById = new DataLoader<string, JobApplication | null>(
    async (ids) => {
      observeBatch?.({ loader: "applicationById", keys: ids });

      const applications = await prisma.jobApplication.findMany({
        where: { id: { in: [...ids] }, userId },
      });
      const applicationsById = new Map(
        applications.map((application) => [application.id, application]),
      );

      return ids.map((id) => applicationsById.get(id) ?? null);
    },
  );

  const interviewsByApplicationId = new DataLoader<string, Interview[]>(
    async (applicationIds) => {
      observeBatch?.({
        loader: "interviewsByApplicationId",
        keys: applicationIds,
      });

      const interviews = await prisma.interview.findMany({
        where: {
          applicationId: { in: [...applicationIds] },
          application: { userId },
        },
        orderBy: { scheduledAt: "asc" },
      });
      const grouped = new Map<string, Interview[]>();

      for (const interview of interviews) {
        const group = grouped.get(interview.applicationId) ?? [];
        group.push(interview);
        grouped.set(interview.applicationId, group);
      }

      return applicationIds.map((id) => grouped.get(id) ?? []);
    },
  );

  const applicationsByCompanyId = new DataLoader<string, JobApplication[]>(
    async (companyIds) => {
      observeBatch?.({ loader: "applicationsByCompanyId", keys: companyIds });

      const applications = await prisma.jobApplication.findMany({
        where: { companyId: { in: [...companyIds] }, userId },
        orderBy: { createdAt: "desc" },
      });
      const grouped = new Map<string, JobApplication[]>();

      for (const application of applications) {
        const group = grouped.get(application.companyId) ?? [];
        group.push(application);
        grouped.set(application.companyId, group);
      }

      return companyIds.map((id) => grouped.get(id) ?? []);
    },
  );

  return {
    applicationById,
    applicationsByCompanyId,
    companyById,
    interviewsByApplicationId,
    userById,
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
