import { GraphQLError } from "graphql";

import {
  createAccessToken,
  hashPassword,
  verifyPassword,
} from "./auth.js";
import type { GraphQLContext as Context } from "./context.js";
import { badUserInput, forbidden } from "./errors.js";
import {
  decodeApplicationCursor,
  encodeApplicationCursor,
} from "./pagination.js";
import { dateTimeScalar } from "./scalars.js";
import type {
  AddInterviewInput,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "./services/application-service.js";

type ApplicationStatus =
  | "SAVED"
  | "APPLIED"
  | "INTERVIEWING"
  | "REJECTED"
  | "OFFER";

type ApplicationParent = {
  id: string;
  companyId: string;
  userId: string;
};

type CompanyParent = {
  id: string;
};

type InterviewParent = {
  applicationId: string;
};

type ApplicationFilter = {
  status?: ApplicationStatus;
  roleContains?: string;
  companyNameContains?: string;
};

type CredentialsInput = {
  email: string;
  password: string;
};

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw badUserInput("A valid email address is required.");
  }

  return normalized;
}

function validatePassword(password: string) {
  if (password.length < 10 || password.length > 128) {
    throw badUserInput("Password must contain between 10 and 128 characters.");
  }
}

export const resolvers = {
  DateTime: dateTimeScalar,

  Query: {
    me: async (
      _parent: unknown,
      _args: unknown,
      context: Context,
    ) => {
      const userId = context.currentUser!.id;
      const user = await context.prisma.user.findUnique({ where: { id: userId } });
      return user!;
    },

    users: (_parent: unknown, _args: unknown, context: Context) =>
      context.prisma.user.findMany({ orderBy: { email: "asc" } }),

    applications: (
      _parent: unknown,
      { status }: { status?: ApplicationStatus },
      context: Context,
    ) => {
      const userId = context.currentUser!.id;
      return context.prisma.jobApplication.findMany({
        where: { userId, status },
        orderBy: { createdAt: "desc" },
      });
    },

    application: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context,
    ) => {
      const userId = context.currentUser!.id;
      return context.prisma.jobApplication.findFirst({ where: { id, userId } });
    },

    applicationPage: async (
      _parent: unknown,
      {
        first,
        after,
        filter,
      }: {
        first: number;
        after?: string;
        filter?: ApplicationFilter;
      },
      context: Context,
    ) => {
      const userId = context.currentUser!.id;

      if (first < 1 || first > 50) {
        throw new GraphQLError("first must be between 1 and 50.", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const cursor = after ? decodeApplicationCursor(after) : undefined;
      const applications = await context.prisma.jobApplication.findMany({
        where: {
          userId,
          status: filter?.status,
          role: filter?.roleContains
            ? { contains: filter.roleContains.trim() }
            : undefined,
          company: filter?.companyNameContains
            ? { name: { contains: filter.companyNameContains.trim() } }
            : undefined,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        cursor: cursor ? { id: cursor.id } : undefined,
        skip: cursor ? 1 : undefined,
        take: first + 1,
      });

      const hasNextPage = applications.length > first;
      const page = hasNextPage ? applications.slice(0, first) : applications;

      return {
        edges: page.map((application) => ({
          cursor: encodeApplicationCursor(application.id),
          node: application,
        })),
        pageInfo: {
          hasNextPage,
          endCursor:
            page.length > 0
              ? encodeApplicationCursor(page[page.length - 1].id)
              : null,
        },
      };
    },
  },

  Mutation: {
    register: async (
      _parent: unknown,
      { input }: { input: CredentialsInput },
      { prisma }: Context,
    ) => {
      const email = normalizeEmail(input.email);
      validatePassword(input.password);

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        throw badUserInput("An account with this email already exists.");
      }

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(input.password),
        },
      });

      return {
        token: await createAccessToken(user.id),
        user,
      };
    },

    login: async (
      _parent: unknown,
      { input }: { input: CredentialsInput },
      { prisma }: Context,
    ) => {
      const email = normalizeEmail(input.email);
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new GraphQLError("Invalid email or password.", {
          extensions: { code: "UNAUTHENTICATED" },
        });
      }

      return {
        token: await createAccessToken(user.id),
        user,
      };
    },

    createApplication: async (
      _parent: unknown,
      { input }: { input: CreateApplicationInput },
      context: Context,
    ) => {
      return context.services.applications.create(context.currentUser!.id, input);
    },

    updateApplicationStatus: async (
      _parent: unknown,
      { id, status }: { id: string; status: ApplicationStatus },
      context: Context,
    ) => {
      const application = await context.services.applications.updateStatus(
        context.currentUser!.id,
        id,
        status,
      );
      context.loaders.applicationById.clear(id).prime(id, application);
      return application;
    },

    addInterview: async (
      _parent: unknown,
      { input }: { input: AddInterviewInput },
      context: Context,
    ) => {
      const interview = await context.services.applications.addInterview(
        context.currentUser!.id,
        input,
      );
      context.loaders.interviewsByApplicationId.clear(input.applicationId);
      return interview;
    },

    updateApplication: async (
      _parent: unknown,
      {
        id,
        input,
      }: {
        id: string;
        input: UpdateApplicationInput;
      },
      context: Context,
    ) => {
      const { application, previousCompanyId } =
        await context.services.applications.update(
          context.currentUser!.id,
          id,
          input,
        );
      const { loaders } = context;

      loaders.applicationById.clear(id).prime(id, application);
      loaders.applicationsByCompanyId.clear(previousCompanyId);
      loaders.applicationsByCompanyId.clear(application.companyId);

      return { application };
    },

    deleteApplication: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context,
    ) => {
      const { loaders } = context;
      const deleted = await context.services.applications.delete(
        context.currentUser!.id,
        id,
      );

      loaders.applicationById.clear(id);
      loaders.interviewsByApplicationId.clear(id);
      loaders.applicationsByCompanyId.clear(deleted.companyId);

      return {
        deletedApplicationId: deleted.deletedApplicationId,
        deletedInterviewCount: deleted.deletedInterviewCount,
      };
    },
  },

  JobApplication: {
    company: (
      application: ApplicationParent,
      _args: unknown,
      { loaders }: Context,
    ) => loaders.companyById.load(application.companyId),

    interviews: (
      application: ApplicationParent,
      _args: unknown,
      { loaders }: Context,
    ) => loaders.interviewsByApplicationId.load(application.id),

    owner: (
      application: ApplicationParent,
      _args: unknown,
      { loaders }: Context,
    ) => loaders.userById.load(application.userId),
  },

  Interview: {
    application: (
      interview: InterviewParent,
      _args: unknown,
      { loaders }: Context,
    ) => loaders.applicationById.load(interview.applicationId),
  },

  Company: {
    applications: (
      company: CompanyParent,
      _args: unknown,
      { loaders }: Context,
    ) => loaders.applicationsByCompanyId.load(company.id),
  },

  User: {
    applications: (
      user: { id: string },
      _args: unknown,
      context: Context,
    ) => {
      const currentUserId = context.currentUser!.id;

      if (user.id !== currentUserId) {
        throw forbidden("You cannot access another user's applications.");
      }

      return context.prisma.jobApplication.findMany({
        where: { userId: currentUserId },
        orderBy: { createdAt: "desc" },
      });
    },
  },
};
