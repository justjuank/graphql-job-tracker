export const typeDefs = `#graphql
  "An ISO-8601 date and time, normalized to UTC in responses."
  scalar DateTime

  "Require a valid authenticated user before resolving this field."
  directive @authenticated on FIELD_DEFINITION

  "Require an authenticated user with the specified role."
  directive @requiresRole(role: UserRole!) on FIELD_DEFINITION

  enum UserRole {
    USER
    ADMIN
  }

  "The current stage of a job application."
  enum ApplicationStatus {
    SAVED
    APPLIED
    INTERVIEWING
    REJECTED
    OFFER
  }

  "The format or purpose of an interview."
  enum InterviewType {
    PHONE_SCREEN
    TECHNICAL
    BEHAVIORAL
    ONSITE
  }

  "A company with one or more job applications."
  type Company {
    id: ID!
    name: String!
    applications: [JobApplication!]!
  }

  type User {
    id: ID!
    email: String!
    role: UserRole!
    applications: [JobApplication!]! @authenticated
  }

  "A job opportunity being tracked by the candidate."
  type JobApplication {
    id: ID!
    role: String!
    status: ApplicationStatus!
    createdAt: DateTime!
    company: Company!
    interviews: [Interview!]!
    owner: User!
  }

  "An interview scheduled for a job application."
  type Interview {
    id: ID!
    type: InterviewType!
    scheduledAt: DateTime!
    application: JobApplication!
  }

  input CreateApplicationInput {
    companyName: String!
    role: String!
    status: ApplicationStatus = SAVED
  }

  input RegisterInput {
    email: String!
    password: String!
    turnstileToken: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input AddInterviewInput {
    applicationId: ID!
    type: InterviewType!
    scheduledAt: DateTime!
  }

  "Fields to change on an application. Omitted fields remain unchanged."
  input UpdateApplicationInput {
    role: String
    status: ApplicationStatus
    companyName: String
  }

  type UpdateApplicationPayload {
    application: JobApplication!
  }

  type DeleteApplicationPayload {
    deletedApplicationId: ID!
    deletedInterviewCount: Int!
  }

  input ApplicationFilter {
    status: ApplicationStatus
    roleContains: String
    companyNameContains: String
  }

  type ApplicationEdge {
    cursor: String!
    node: JobApplication!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type ApplicationConnection {
    edges: [ApplicationEdge!]!
    pageInfo: PageInfo!
  }

  type Query {
    "Return the user represented by the bearer token."
    me: User! @authenticated

    "List users. This administrative field demonstrates role authorization."
    users: [User!]! @requiresRole(role: ADMIN)

    "Return all applications, optionally filtered by status."
    applications(status: ApplicationStatus): [JobApplication!]! @authenticated

    "Find one application by its ID."
    application(id: ID!): JobApplication @authenticated

    "Return a filtered, cursor-paginated page of applications."
    applicationPage(
      first: Int = 10
      after: String
      filter: ApplicationFilter
    ): ApplicationConnection! @authenticated
  }

  type Mutation {
    "Create a user and return a signed access token."
    register(input: RegisterInput!): AuthPayload!

    "Exchange email and password credentials for an access token."
    login(input: LoginInput!): AuthPayload!

    "Create a job application, reusing an existing company when possible."
    createApplication(input: CreateApplicationInput!): JobApplication! @authenticated

    "Move an application to a different stage."
    updateApplicationStatus(id: ID!, status: ApplicationStatus!): JobApplication! @authenticated

    "Schedule an interview for an existing application."
    addInterview(input: AddInterviewInput!): Interview! @authenticated

    "Update one or more fields on an existing application."
    updateApplication(
      id: ID!
      input: UpdateApplicationInput!
    ): UpdateApplicationPayload! @authenticated

    "Delete an application and its interviews."
    deleteApplication(id: ID!): DeleteApplicationPayload! @authenticated
  }
`;
