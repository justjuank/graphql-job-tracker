import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";

import {
  authenticateBearerToken,
  hashPassword,
} from "../src/auth.js";
import { createPrismaClient } from "../src/db.js";
import {
  createLoaders,
  type BatchEvent,
} from "../src/loaders.js";
import { createServer } from "../src/server.js";
import { seedDatabase } from "../src/seed.js";
import { ApplicationService } from "../src/services/application-service.js";

const server = createServer();
const prisma = createPrismaClient(process.env.TEST_DATABASE_URL);

function contextValue(
  observeBatch?: (event: BatchEvent) => void,
  currentUserId = "user-1",
  currentUserRole: "USER" | "ADMIN" = "ADMIN",
) {
  return {
    currentUser: currentUserId
      ? { id: currentUserId, role: currentUserRole }
      : null,
    prisma,
    loaders: createLoaders(prisma, currentUserId, observeBatch),
    services: {
      applications: new ApplicationService(prisma),
    },
  };
}

function asPlainObject(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value));
}

before(async () => {
  await server.start();
});

after(async () => {
  await server.stop();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await seedDatabase(prisma);
});

test("logs in with seeded credentials and returns a verifiable access token", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user { id email role }
          }
        }
      `,
      variables: {
        input: {
          email: "DEMO@example.com",
          password: "portfolio-demo-password",
        },
      },
    },
    { contextValue: contextValue(undefined, "") },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  const data = asPlainObject(response.body.singleResult.data) as {
    login: { token: string; user: { id: string; email: string; role: string } };
  };
  assert.deepEqual(data.login.user, {
    id: "user-1",
    email: "demo@example.com",
    role: "ADMIN",
  });
  assert.equal(
    await authenticateBearerToken(`Bearer ${data.login.token}`),
    "user-1",
  );
});

test("registers a user with a normalized email and returns an access token", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user { id email role }
          }
        }
      `,
      variables: {
        input: {
          email: "  NEW.USER@example.com  ",
          password: "a-secure-demo-password",
        },
      },
    },
    { contextValue: contextValue(undefined, "") },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  const data = asPlainObject(response.body.singleResult.data) as {
    register: { token: string; user: { id: string; email: string; role: string } };
  };
  assert.equal(data.register.user.email, "new.user@example.com");
  assert.equal(data.register.user.role, "USER");
  assert.equal(
    await authenticateBearerToken(`Bearer ${data.register.token}`),
    data.register.user.id,
  );
});

test("rejects protected queries without an authenticated user", async () => {
  const response = await server.executeOperation(
    { query: `query { applications { id } }` },
    { contextValue: contextValue(undefined, "") },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(response.body.singleResult.data, null);
  assert.equal(
    response.body.singleResult.errors?.[0].extensions?.code,
    "UNAUTHENTICATED",
  );
});

test("requires the ADMIN role for the users field", async () => {
  const regularUser = await prisma.user.create({
    data: {
      id: "user-2",
      email: "regular@example.com",
      passwordHash: await hashPassword("regular-user-password"),
    },
  });

  const forbiddenResponse = await server.executeOperation(
    { query: `query { users { id } }` },
    { contextValue: contextValue(undefined, regularUser.id, "USER") },
  );

  assert.equal(forbiddenResponse.body.kind, "single");
  assert.equal(
    forbiddenResponse.body.singleResult.errors?.[0].extensions?.code,
    "FORBIDDEN",
  );

  const adminResponse = await server.executeOperation(
    { query: `query { users { email role } }` },
    { contextValue: contextValue() },
  );

  assert.equal(adminResponse.body.kind, "single");
  assert.deepEqual(adminResponse.body.singleResult.errors, undefined);
  const data = asPlainObject(adminResponse.body.singleResult.data) as {
    users: Array<{ email: string; role: string }>;
  };
  assert.deepEqual(data.users, [
    { email: "demo@example.com", role: "ADMIN" },
    { email: "regular@example.com", role: "USER" },
  ]);
});

test("scopes application queries to the authenticated owner", async () => {
  const secondUser = await prisma.user.create({
    data: {
      id: "user-2",
      email: "other@example.com",
      passwordHash: await hashPassword("another-demo-password"),
    },
  });
  const otherApplication = await prisma.jobApplication.create({
    data: {
      id: "application-other",
      role: "Private Role",
      company: { connect: { id: "company-1" } },
      user: { connect: { id: secondUser.id } },
    },
  });

  const response = await server.executeOperation(
    {
      query: `#graphql
        query OwnedApplications($otherId: ID!) {
          applications { id }
          application(id: $otherId) { id }
        }
      `,
      variables: { otherId: otherApplication.id },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  const data = asPlainObject(response.body.singleResult.data) as {
    applications: Array<{ id: string }>;
    application: { id: string } | null;
  };
  assert.equal(data.applications.length, 2);
  assert.equal(data.application, null);
});

test("prevents a service-backed mutation from changing another user's application", async () => {
  const regularUser = await prisma.user.create({
    data: {
      id: "user-2",
      email: "regular@example.com",
      passwordHash: await hashPassword("regular-user-password"),
    },
  });

  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation {
          updateApplicationStatus(id: "application-1", status: OFFER) {
            id
          }
        }
      `,
    },
    { contextValue: contextValue(undefined, regularUser.id, "USER") },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(
    response.body.singleResult.errors?.[0].extensions?.code,
    "NOT_FOUND",
  );
  const application = await prisma.jobApplication.findUnique({
    where: { id: "application-1" },
  });
  assert.equal(application?.status, "APPLIED");
});

test("filters applications and resolves their companies", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        query ApplicationsByStatus($status: ApplicationStatus) {
          applications(status: $status) {
            role
            status
            company { name }
          }
        }
      `,
      variables: { status: "INTERVIEWING" },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    applications: [
      {
        role: "Platform Engineer",
        status: "INTERVIEWING",
        company: { name: "Globex" },
      },
    ],
  });
});

test("creates an application", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation CreateApplication($input: CreateApplicationInput!) {
          createApplication(input: $input) {
            role
            status
            company { name }
          }
        }
      `,
      variables: {
        input: {
          companyName: "Initech",
          role: "Software Engineer",
          status: "SAVED",
        },
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    createApplication: {
      role: "Software Engineer",
      status: "SAVED",
      company: { name: "Initech" },
    },
  });
});

test("updates selected application fields and returns a payload", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
          updateApplication(id: $id, input: $input) {
            application {
              id
              role
              status
              company { name }
            }
          }
        }
      `,
      variables: {
        id: "application-1",
        input: {
          role: "Senior Backend Engineer",
          status: "INTERVIEWING",
          companyName: "Umbrella",
        },
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    updateApplication: {
      application: {
        id: "application-1",
        role: "Senior Backend Engineer",
        status: "INTERVIEWING",
        company: { name: "Umbrella" },
      },
    },
  });
});

test("rejects an update with no fields", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
          updateApplication(id: $id, input: $input) {
            application { id }
          }
        }
      `,
      variables: { id: "application-1", input: {} },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(response.body.singleResult.data, null);
  assert.equal(
    response.body.singleResult.errors?.[0].extensions?.code,
    "BAD_USER_INPUT",
  );
});

test("deletes an application and cascades to its interviews", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation DeleteApplication($id: ID!) {
          deleteApplication(id: $id) {
            deletedApplicationId
            deletedInterviewCount
          }
        }
      `,
      variables: { id: "application-2" },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    deleteApplication: {
      deletedApplicationId: "application-2",
      deletedInterviewCount: 1,
    },
  });
  assert.equal(
    await prisma.jobApplication.findUnique({ where: { id: "application-2" } }),
    null,
  );
  assert.equal(
    await prisma.interview.count({
      where: { applicationId: "application-2" },
    }),
    0,
  );
  assert.equal(
    await prisma.company.count({ where: { id: "company-2" } }),
    1,
  );
});

test("returns a NOT_FOUND error when deleting an unknown application", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation DeleteApplication($id: ID!) {
          deleteApplication(id: $id) { deletedApplicationId }
        }
      `,
      variables: { id: "missing" },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(response.body.singleResult.data, null);
  assert.equal(response.body.singleResult.errors?.[0].extensions?.code, "NOT_FOUND");
});

test("resolves interviews only through their application relationship", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        query ApplicationWithInterviews($id: ID!) {
          application(id: $id) {
            role
            interviews {
              type
              scheduledAt
            }
          }
        }
      `,
      variables: { id: "application-2" },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    application: {
      role: "Platform Engineer",
      interviews: [
        {
          type: "TECHNICAL",
          scheduledAt: "2026-09-28T15:00:00.000Z",
        },
      ],
    },
  });
});

test("adds an interview to an existing application", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation AddInterview($input: AddInterviewInput!) {
          addInterview(input: $input) {
            type
            scheduledAt
            application {
              id
              role
            }
          }
        }
      `,
      variables: {
        input: {
          applicationId: "application-1",
          type: "PHONE_SCREEN",
          scheduledAt: "2026-10-01T10:30:00-05:00",
        },
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    addInterview: {
      type: "PHONE_SCREEN",
      scheduledAt: "2026-10-01T15:30:00.000Z",
      application: {
        id: "application-1",
        role: "Backend Engineer",
      },
    },
  });
  assert.equal(await prisma.interview.count(), 2);
});

test("rejects an invalid DateTime before running the mutation resolver", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        mutation AddInterview($input: AddInterviewInput!) {
          addInterview(input: $input) { id }
        }
      `,
      variables: {
        input: {
          applicationId: "application-1",
          type: "PHONE_SCREEN",
          scheduledAt: "not-a-date",
        },
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(response.body.singleResult.data, undefined);
  assert.equal(response.body.singleResult.errors?.length, 1);
  assert.match(
    response.body.singleResult.errors?.[0].message ?? "",
    /DateTime must be a valid ISO-8601 date-time string/,
  );
  assert.equal(await prisma.interview.count(), 1);
});

test("batches relationship lookups across a list of applications", async () => {
  const batches: BatchEvent[] = [];
  const response = await server.executeOperation(
    {
      query: `#graphql
        query ApplicationsWithRelationships {
          applications {
            role
            company { name }
            interviews { type }
          }
        }
      `,
    },
    { contextValue: contextValue((event) => batches.push(event)) },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.equal(
    (asPlainObject(response.body.singleResult.data) as { applications: unknown[] })
      .applications.length,
    2,
  );
  assert.deepEqual(batches, [
    {
      loader: "companyById",
      keys: ["company-2", "company-1"],
    },
    {
      loader: "interviewsByApplicationId",
      keys: ["application-2", "application-1"],
    },
  ]);
});

test("paginates applications with an opaque cursor", async () => {
  const firstPage = await server.executeOperation(
    {
      query: `#graphql
        query ApplicationPage($first: Int!, $after: String) {
          applicationPage(first: $first, after: $after) {
            edges {
              cursor
              node { id role }
            }
            pageInfo { hasNextPage endCursor }
          }
        }
      `,
      variables: { first: 1 },
    },
    { contextValue: contextValue() },
  );

  assert.equal(firstPage.body.kind, "single");
  assert.deepEqual(firstPage.body.singleResult.errors, undefined);
  const firstData = asPlainObject(firstPage.body.singleResult.data) as {
    applicationPage: {
      edges: Array<{ cursor: string; node: { id: string; role: string } }>;
      pageInfo: { hasNextPage: boolean; endCursor: string };
    };
  };
  assert.equal(firstData.applicationPage.edges.length, 1);
  assert.equal(firstData.applicationPage.edges[0].node.id, "application-2");
  assert.equal(firstData.applicationPage.pageInfo.hasNextPage, true);

  const secondPage = await server.executeOperation(
    {
      query: `#graphql
        query ApplicationPage($first: Int!, $after: String) {
          applicationPage(first: $first, after: $after) {
            edges { node { id role } }
            pageInfo { hasNextPage endCursor }
          }
        }
      `,
      variables: {
        first: 1,
        after: firstData.applicationPage.pageInfo.endCursor,
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(secondPage.body.kind, "single");
  assert.deepEqual(secondPage.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(secondPage.body.singleResult.data), {
    applicationPage: {
      edges: [
        {
          node: {
            id: "application-1",
            role: "Backend Engineer",
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: "eyJpZCI6ImFwcGxpY2F0aW9uLTEifQ",
      },
    },
  });
});

test("filters a page by status and company name", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        query FilteredApplicationPage($filter: ApplicationFilter) {
          applicationPage(filter: $filter) {
            edges {
              node {
                role
                status
                company { name }
              }
            }
          }
        }
      `,
      variables: {
        filter: {
          status: "INTERVIEWING",
          companyNameContains: "Glob",
        },
      },
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    applicationPage: {
      edges: [
        {
          node: {
            role: "Platform Engineer",
            status: "INTERVIEWING",
            company: { name: "Globex" },
          },
        },
      ],
    },
  });
});

test("rejects recursive relationship queries that exceed the depth policy", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        query ExcessivelyNestedApplications {
          applications {
            company {
              applications {
                company {
                  applications {
                    company {
                      applications { id }
                    }
                  }
                }
              }
            }
          }
        }
      `,
    },
    { contextValue: contextValue() },
  );

  assert.equal(response.body.kind, "single");
  assert.equal(response.body.singleResult.data, undefined);
  assert.equal(
    response.body.singleResult.errors?.[0].extensions?.code,
    "GRAPHQL_VALIDATION_FAILED",
  );
  assert.match(
    response.body.singleResult.errors?.[0].message ?? "",
    /depth|nested/i,
  );
});

test("uses pagination variables when calculating query complexity", async () => {
  const query = `#graphql
    query CostedApplicationPage($first: Int!) {
      applicationPage(first: $first) {
        edges {
          node {
            id
            role
            status
            createdAt
            company { id name }
            interviews { id type scheduledAt }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;

  const accepted = await server.executeOperation(
    { query, variables: { first: 1 } },
    { contextValue: contextValue() },
  );
  assert.equal(accepted.body.kind, "single");
  assert.deepEqual(accepted.body.singleResult.errors, undefined);

  const rejected = await server.executeOperation(
    { query, variables: { first: 10 } },
    { contextValue: contextValue() },
  );
  assert.equal(rejected.body.kind, "single");
  assert.equal(rejected.body.singleResult.data, undefined);
  assert.equal(
    rejected.body.singleResult.errors?.[0].extensions?.code,
    "QUERY_TOO_COMPLEX",
  );
  assert.equal(
    rejected.body.singleResult.errors?.[0].extensions?.maxComplexity,
    200,
  );
  assert.ok(
    Number(rejected.body.singleResult.errors?.[0].extensions?.complexity) > 200,
  );
});

test("keeps introspection available for schema autocomplete", async () => {
  const response = await server.executeOperation(
    {
      query: `#graphql
        query IntrospectionQuery {
          __schema { queryType { name } }
        }
      `,
    },
    { contextValue: contextValue(undefined, "") },
  );

  assert.equal(response.body.kind, "single");
  assert.deepEqual(response.body.singleResult.errors, undefined);
  assert.deepEqual(asPlainObject(response.body.singleResult.data), {
    __schema: { queryType: { name: "Query" } },
  });
});
