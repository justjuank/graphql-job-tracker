# GraphQL Job Tracker

A small portfolio project for learning GraphQL by building a useful job
application tracker. Apollo Server exposes the GraphQL API, and Prisma stores
users, companies, applications, and interviews in PostgreSQL.

## What this version teaches

- A GraphQL schema as the API contract
- Object types, enums, input types, queries, and mutations
- Root and field resolvers
- Resolver arguments and shared request context
- Relationships between `JobApplication` and `Company`
- One-to-many relationships between applications and interviews
- Persistent data with Prisma and PostgreSQL
- Database migrations and repeatable seed data
- Request-scoped batching and caching with DataLoader
- Cursor pagination and composable application filters
- A custom `DateTime` scalar with input coercion and UTC serialization
- Partial updates, deletion payloads, and cascading relational deletes
- GraphQL errors and nullable fields
- Registration and login with hashed passwords and signed access tokens
- A client account-creation flow with password confirmation and automatic sign-in
- Lightweight per-IP registration throttling for public deployments
- Cloudflare Turnstile bot protection with server-side token verification
- Request authentication and per-user application ownership
- Declarative field authorization with custom schema directives and roles
- Thin resolvers backed by a reusable application service
- Query-depth, recursive-field, and variable-aware complexity limits
- A React and Apollo Client frontend with bearer-token authentication
- A responsive Tailwind CSS design system using the official Vite integration
- Reusable UI primitives and focused dashboard components
- Schema-validated client operations and generated TypeScript types
- Creating applications from the client with mutation refetching
- Optimistic status updates through Apollo's normalized cache
- Lazy application details, editing, interview scheduling, and deletion
- Testing operations without opening a network port
- Component tests with Vitest, Testing Library, and Apollo's mocked provider
- Express-based production HTTP configuration, health checks, and restricted CORS
- PostgreSQL-backed CI validation with GitHub Actions

## Run locally

```bash
npm install
npm --prefix client install
npm run db:up
npm run db:deploy
npm run db:seed:demo
```

Start the API and client in separate terminals:

```bash
npm run dev
```

```bash
npm run dev:client
```

Copy `.env.example` to `.env` and `client/.env.example` to `client/.env.local`
before starting, then replace `JWT_SECRET` with a private value containing at
least 32 characters. The checked-in Turnstile values are Cloudflare's published
test keys and are safe only for local development and automated testing. Docker
exposes this project's PostgreSQL instance on port 5433 to avoid common conflicts
with port 5432.
`npm run db:seed:demo` resets only the local database and creates the demo
account described below. The seed script refuses to run when
`NODE_ENV=production`.

Open <http://localhost:4000/graphql> to use Apollo Sandbox.
Open <http://localhost:5173> to use the React client.

GraphQL resolvers receive a PostgreSQL-backed Prisma client through Apollo's
request context. Run `npm run db:down` when you want to stop the local database;
its Docker volume preserves the data between runs.

## Authenticate

Register a new account, or log in with the seeded local account. The credentials
below exist only after running the local demo seed and are never created by the
production migration or deployment path:

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

The React client supports both sign-in and self-service registration through
Apollo Client. Registration confirms the password in the browser, creates a
regular `USER` account, and signs the user in with the returned token. Its
`SetContextLink` reads the current access token from `sessionStorage` for every
operation and adds the bearer header. Logging out removes the token and clears
Apollo's normalized cache so cached data cannot leak into a later session.
Production builds also leave the login fields blank and do not display local
demo credentials.

To limit automated account creation, the API permits five registration attempts
per client IP per hour and requires a valid Cloudflare Turnstile token. The
browser obtains the token, but the API independently verifies its signature,
`register` action, and production hostname before creating a user. The simple
in-memory rate limit is appropriate for the single API instance used by this
portfolio deployment; use a shared store if the API is scaled horizontally.

## Deploy the portfolio

[`render.yaml`](render.yaml) defines a free Render web service for the API and a
free Render static site for the React client. The deployment expects a separate
Neon PostgreSQL database so application data is not stored on Render's ephemeral
filesystem.

Before creating the Render Blueprint:

1. Create a Neon project and copy its pooled connection string.
2. Create a Cloudflare Turnstile widget for the final frontend hostname and copy
   its site key and secret key.
3. In Render, create a Blueprint from this repository and provide the prompted
   secret values:
   - API `DATABASE_URL`: the Neon connection string.
   - API `TURNSTILE_SECRET_KEY`: the private Cloudflare secret.
   - Client `VITE_TURNSTILE_SITE_KEY`: the public Cloudflare site key.
4. If Render assigns different service hostnames, update `CLIENT_ORIGIN`,
   `TURNSTILE_EXPECTED_HOSTNAME`, and `VITE_GRAPHQL_URL` in the Blueprint before
   deploying again. Also add the actual frontend hostname to the Turnstile
   widget's allowed hostnames.

The API build applies committed Prisma migrations with `prisma migrate deploy`;
it never runs the demo seed in production. Free services can sleep or scale to
zero when idle, so the first request after inactivity may take longer.

## Generate client operation types

The client uses GraphQL Code Generator's client preset. It reads the server's
`typeDefs` directly from `src/schema.ts`, validates every client operation, and
generates typed documents in `client/src/gql/`.

```bash
npm --prefix client run codegen
```

Generation runs automatically before `dev` and `build`. While editing several
operations, run the watcher in a separate terminal:

```bash
npm --prefix client run codegen:watch
```

Files in `client/src/gql/` are generated artifacts and should not be edited by
hand. Components use the generated `graphql()` function, allowing Apollo hooks
to infer operation results and variables without handwritten mirror types.

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

## Query depth and complexity protection

GraphQL clients choose their own response shape, so the server validates the
cost of an operation before running any resolver. `src/query-protection.ts`
provides two complementary protections:

- A static validation rule limits selection depth, nested lists, repeated
  traversal of the same field, and total query nodes.
- An Apollo `didResolveOperation` plugin calculates request-specific complexity
  after variables are available but before execution starts.

List fields use estimated result-size multipliers. The cursor connection uses
its actual `first` argument, so requesting a larger page costs more even when
`first` is supplied through a variable. Requests over the budget return a
`QUERY_TOO_COMPLEX` error. Introspection has separate depth protection and is
kept available for Apollo Sandbox and Postman's schema autocomplete.

The defaults can be tuned without changing code:

```dotenv
GRAPHQL_MAX_DEPTH="8"
GRAPHQL_MAX_LIST_DEPTH="3"
GRAPHQL_MAX_SELF_REFERENTIAL_DEPTH="2"
GRAPHQL_MAX_COMPLEXITY="200"
GRAPHQL_MAX_QUERY_NODES="1000"
```

Complexity is a protective estimate, not a measurement of database time. It
should be tuned using observed production operations and combined with
pagination, rate limiting, request-size limits, and execution timeouts.

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

The API integration suite uses the `job_tracker_test` PostgreSQL database from
the local Docker service. GitHub Actions provisions the same database engine as
an isolated service container.

```bash
npm run typecheck
npm test
npm --prefix client run lint
npm --prefix client test
npm --prefix client run build
```

## Project map

```text
src/schema.ts       GraphQL's public contract
src/resolvers.ts    GraphQL fields translated into Prisma operations
src/auth.ts         Password hashing and signed access-token validation
src/config.ts       Validated production port and allowed client origins
src/context.ts      Per-request identity, loaders, and services
src/directives/     Reusable schema authorization enforcement
src/services/       Business rules and ownership-scoped Prisma mutations
src/errors.ts       Consistent GraphQL errors and extension codes
src/db.ts           Prisma client and PostgreSQL adapter construction
src/loaders.ts      Request-scoped relationship batching and caching
src/pagination.ts   Opaque application cursor encoding and validation
src/query-protection.ts Depth and variable-aware complexity policies
src/scalars.ts      DateTime parsing, validation, and serialization
src/turnstile.ts    Server-side registration challenge verification
src/seed.ts         Shared, repeatable seed-data function
src/server.ts       Reusable Apollo Server construction
src/index.ts        HTTP entry point
compose.yaml        Local PostgreSQL development and test service
.github/workflows/ci.yml PostgreSQL-backed API and client validation
client/             React, Vite, and Apollo Client application
client/codegen.ts   Client operation validation and type-generation config
client/src/gql/     Generated typed GraphQL documents and schema types
client/src/**/*.test.tsx Component tests for authenticated GraphQL workflows
render.yaml         Render API and static-site deployment blueprint
prisma/schema.prisma Database models and relationships
prisma/migrations/  Version-controlled database changes
test/server.test.ts GraphQL tests against an isolated PostgreSQL database
```

The client tests exercise authenticated queries, mutations, filtering, error
states, and confirmation flows using deterministic mocked GraphQL responses.
