# GraphQL Job Tracker

A small portfolio project for learning GraphQL by building a useful job
application tracker. Apollo Server exposes the GraphQL API, and Prisma stores
companies, applications, and interviews in SQLite.

## What this version teaches

- A GraphQL schema as the API contract
- Object types, enums, input types, queries, and mutations
- Root and field resolvers
- Resolver arguments and shared request context
- Relationships between `JobApplication` and `Company`
- One-to-many relationships between applications and interviews
- Persistent data with Prisma and SQLite
- Database migrations and repeatable seed data
- Request-scoped batching and caching with DataLoader
- Cursor pagination and composable application filters
- A custom `DateTime` scalar with input coercion and UTC serialization
- Partial updates, deletion payloads, and cascading relational deletes
- GraphQL errors and nullable fields
- Registration and login with hashed passwords and signed access tokens
- Request authentication and per-user application ownership
- Declarative field authorization with custom schema directives and roles
- Thin resolvers backed by a reusable application service
- Testing operations without opening a network port

## Run locally

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

Copy `.env.example` to `.env` before starting, and replace `JWT_SECRET` with a
private value containing at least 32 characters. `npm run db:seed` resets the
local database and creates the demo account described below.

Open <http://localhost:4000> to use Apollo Sandbox.

The SQLite database is stored locally in `dev.db`. GraphQL resolvers receive a
Prisma client through Apollo's request context and use it to query the database.

## Authenticate

Register a new account, or log in with the seeded local account:

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user { id email }
  }
}
```

```json
{
  "input": {
    "email": "demo@example.com",
    "password": "portfolio-demo-password"
  }
}
```

Copy the returned token into Postman's **Authorization > Bearer Token** field,
or send this HTTP header:

```text
Authorization: Bearer YOUR_TOKEN
```

You can now call protected fields such as `me`, `applications`, and all
application mutations. Each application belongs to a user; resolvers and
relationship loaders only expose records owned by the authenticated user. The
access token expires after one hour. Passwords are stored as salted scrypt
hashes, never as plaintext.

```graphql
query CurrentUser {
  me {
    id
    email
    applications { id role status }
  }
}
```

## Authorization directives and services

Authentication happens once per HTTP request in `src/context.ts`. The resulting
user identity and role are available to every resolver. Protected fields declare
their access policy directly in the GraphQL schema:

```graphql
type Query {
  applications: [JobApplication!]! @authenticated
  users: [User!]! @requiresRole(role: ADMIN)
}
```

The directive transformer in `src/directives/authorization.ts` wraps those
fields before Apollo starts. Anonymous callers receive `UNAUTHENTICATED`, while
signed-in users without the required role receive `FORBIDDEN`.

Directives handle coarse field access. Record-specific rules remain in
`ApplicationService`: every mutation receives the acting user's ID and scopes
its Prisma lookup to that owner. This prevents one user from learning about or
changing another user's applications even if the service is called outside
GraphQL.

The seeded demo user has the `ADMIN` role, so this query succeeds with its
bearer token:

```graphql
query AdminUsers {
  users {
    id
    email
    role
  }
}
```

To inspect and edit the records visually, run:

```bash
npm run db:studio
```

After changing `prisma/schema.prisma`, create a new development migration with
`npm run db:migrate -- --name describe_your_change`.

## Try a query

The remaining examples require the bearer token from the authentication step.

```graphql
query ApplicationsByStatus($status: ApplicationStatus) {
  applications(status: $status) {
    id
    role
    status
    company {
      name
    }
  }
}
```

Variables:

```json
{
  "status": "INTERVIEWING"
}
```

## Try a mutation

```graphql
mutation CreateApplication($input: CreateApplicationInput!) {
  createApplication(input: $input) {
    id
    role
    status
    createdAt
    company {
      name
    }
  }
}
```

Variables:

```json
{
  "input": {
    "companyName": "Initech",
    "role": "Software Engineer",
    "status": "SAVED"
  }
}
```

## Query a nested relationship

`interviews` is not a root query. GraphQL reaches it through its field resolver
on `JobApplication`, and that resolver runs only when this field is selected.

```graphql
query ApplicationWithInterviews($id: ID!) {
  application(id: $id) {
    role
    interviews {
      type
      scheduledAt
    }
  }
}
```

Variables:

```json
{
  "id": "application-2"
}
```

## Relationship batching and the N+1 problem

When a list query returns two applications, resolving `company` and
`interviews` independently could produce one root query plus two company
queries plus two interview queries. As the list grows, the relationship-query
count grows with it.

The loaders in `src/loaders.ts` collect relationship keys during one GraphQL
request and issue set-based Prisma queries. This query therefore uses one
application query, one batched company query, and one batched interview query:

```graphql
query ApplicationsWithRelationships {
  applications {
    role
    company { name }
    interviews { type }
  }
}
```

Loaders are created inside Apollo's context function, so their memoized values
are discarded after each HTTP request. Caches are never shared between users.

## Filter and paginate applications

`applicationPage` is a connection-style field. Request `first` records, then
pass the returned `endCursor` as `after` to retrieve the next page.

```graphql
query ApplicationPage(
  $first: Int!
  $after: String
  $filter: ApplicationFilter
) {
  applicationPage(first: $first, after: $after, filter: $filter) {
    edges {
      cursor
      node {
        id
        role
        status
        company { name }
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

Variables for the first page:

```json
{
  "first": 1,
  "filter": {
    "status": "INTERVIEWING",
    "companyNameContains": "Glob"
  }
}
```

For the next page, copy `pageInfo.endCursor` into an `after` variable. Cursors
are opaque client tokens: clients should store and return them without decoding
or constructing them.

## Schedule an interview

`scheduledAt` is a `DateTime`, not a generic `String`. Inputs must include an
ISO-8601 time and timezone, such as `2026-10-01T10:30:00-05:00`. Resolvers
receive a validated JavaScript `Date`, and responses are normalized to UTC.

```graphql
mutation AddInterview($input: AddInterviewInput!) {
  addInterview(input: $input) {
    type
    scheduledAt
    application {
      role
      company {
        name
      }
    }
  }
}
```

Variables:

```json
{
  "input": {
    "applicationId": "application-1",
    "type": "PHONE_SCREEN",
    "scheduledAt": "2026-10-01T10:30:00-05:00"
  }
}
```

## Update and delete applications

Omitted update fields remain unchanged. Explicit `null` values are rejected so
the mutation's behavior is unambiguous.

```graphql
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
```

```json
{
  "id": "application-1",
  "input": {
    "role": "Senior Backend Engineer",
    "status": "INTERVIEWING"
  }
}
```

Deletion returns structured information rather than a bare boolean:

```graphql
mutation DeleteApplication($id: ID!) {
  deleteApplication(id: $id) {
    deletedApplicationId
    deletedInterviewCount
  }
}
```

Deleting an application removes its interviews through the database foreign-key
cascade, but does not delete its company.

## Validate the project

```bash
npm run typecheck
npm test
```

## Project map

```text
src/schema.ts       GraphQL's public contract
src/resolvers.ts    GraphQL fields translated into Prisma operations
src/auth.ts         Password hashing and signed access-token validation
src/context.ts      Per-request identity, loaders, and services
src/directives/     Reusable schema authorization enforcement
src/services/       Business rules and ownership-scoped Prisma mutations
src/errors.ts       Consistent GraphQL errors and extension codes
src/db.ts           Prisma client and SQLite adapter construction
src/loaders.ts      Request-scoped relationship batching and caching
src/pagination.ts   Opaque application cursor encoding and validation
src/scalars.ts      DateTime parsing, validation, and serialization
src/seed.ts         Shared, repeatable seed-data function
src/server.ts       Reusable Apollo Server construction
src/index.ts        HTTP entry point
prisma/schema.prisma Database models and relationships
prisma/migrations/  Version-controlled database changes
test/server.test.ts GraphQL tests against an isolated SQLite database
```

The next GraphQL milestone is query-depth and complexity protection, followed by
a small Apollo Client interface for the portfolio.
