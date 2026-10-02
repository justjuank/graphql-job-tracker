import type { ApplicationStatus, InterviewType } from "../../generated/prisma/client.js";
import type { DatabaseClient } from "../db.js";
import { applicationNotFound, badUserInput } from "../errors.js";

export type CreateApplicationInput = {
  companyName: string;
  role: string;
  jobPostingUrl?: string | null;
  status: ApplicationStatus;
};

export type AddInterviewInput = {
  applicationId: string;
  type: InterviewType;
  scheduledAt: Date;
};

export type UpdateApplicationInput = {
  role?: string | null;
  status?: ApplicationStatus | null;
  companyName?: string | null;
  jobPostingUrl?: string | null;
};

function validateCompanyName(companyName: string) {
  if (!companyName) {
    throw badUserInput("Company name cannot be blank.");
  }

  if (companyName.length > 120) {
    throw badUserInput("Company name cannot exceed 120 characters.");
  }
}

function validateRole(role: string) {
  if (!role) {
    throw badUserInput("Role cannot be blank.");
  }

  if (role.length > 160) {
    throw badUserInput("Role cannot exceed 160 characters.");
  }
}

function normalizeJobPostingUrl(value: string | null | undefined) {
  if (value == null || value.trim() === "") return null;

  const jobPostingUrl = value.trim();
  if (jobPostingUrl.length > 2048) {
    throw badUserInput("Job posting URL cannot exceed 2048 characters.");
  }

  try {
    const parsedUrl = new URL(jobPostingUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Unsupported URL protocol.");
    }
  } catch {
    throw badUserInput("Job posting URL must be a valid HTTP or HTTPS URL.");
  }

  return jobPostingUrl;
}

export class ApplicationService {
  constructor(private readonly prisma: DatabaseClient) {}

  create(userId: string, input: CreateApplicationInput) {
    const companyName = input.companyName.trim();
    const role = input.role.trim();
    const jobPostingUrl = normalizeJobPostingUrl(input.jobPostingUrl);

    validateCompanyName(companyName);
    validateRole(role);

    return this.prisma.jobApplication.create({
      data: {
        role,
        jobPostingUrl,
        status: input.status,
        user: { connect: { id: userId } },
        company: {
          connectOrCreate: {
            where: { name: companyName },
            create: { name: companyName },
          },
        },
      },
    });
  }

  async updateStatus(userId: string, id: string, status: ApplicationStatus) {
    await this.requireOwnedApplication(userId, id);

    return this.prisma.jobApplication.update({
      where: { id },
      data: { status },
    });
  }

  async addInterview(userId: string, input: AddInterviewInput) {
    await this.requireOwnedApplication(userId, input.applicationId);

    return this.prisma.interview.create({
      data: {
        applicationId: input.applicationId,
        type: input.type,
        scheduledAt: input.scheduledAt,
      },
    });
  }

  async update(userId: string, id: string, input: UpdateApplicationInput) {
    if (Object.keys(input).length === 0) {
      throw badUserInput("At least one field must be supplied for an update.");
    }

    if (input.role === null || input.status === null || input.companyName === null) {
      throw badUserInput("Update fields cannot be null; omit unchanged fields.");
    }

    const existing = await this.requireOwnedApplication(userId, id);
    const role = input.role?.trim();
    const companyName = input.companyName?.trim();
    const jobPostingUrl =
      input.jobPostingUrl === undefined
        ? undefined
        : normalizeJobPostingUrl(input.jobPostingUrl);

    if (role !== undefined) validateRole(role);
    if (companyName !== undefined) validateCompanyName(companyName);

    const application = await this.prisma.jobApplication.update({
      where: { id },
      data: {
        role,
        jobPostingUrl,
        status: input.status ?? undefined,
        company:
          companyName !== undefined
            ? {
                connectOrCreate: {
                  where: { name: companyName },
                  create: { name: companyName },
                },
              }
            : undefined,
      },
    });

    return { application, previousCompanyId: existing.companyId };
  }

  async delete(userId: string, id: string) {
    return this.prisma.$transaction(async (transaction) => {
      const application = await transaction.jobApplication.findFirst({
        where: { id, userId },
        select: { id: true, companyId: true },
      });

      if (!application) throw applicationNotFound(id);

      const deletedInterviewCount = await transaction.interview.count({
        where: { applicationId: id },
      });

      await transaction.jobApplication.delete({ where: { id } });

      return {
        companyId: application.companyId,
        deletedApplicationId: application.id,
        deletedInterviewCount,
      };
    });
  }

  private async requireOwnedApplication(userId: string, id: string) {
    const application = await this.prisma.jobApplication.findFirst({
      where: { id, userId },
    });

    if (!application) throw applicationNotFound(id);
    return application;
  }
}
