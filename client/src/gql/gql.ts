/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query Dashboard(\n    $first: Int!\n    $after: String\n    $filter: ApplicationFilter\n  ) {\n    me {\n      id\n      email\n      role\n      applications {\n        id\n        status\n      }\n    }\n    applicationPage(first: $first, after: $after, filter: $filter) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          status\n          createdAt\n          company {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": typeof types.DashboardDocument,
    "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n    }\n  }\n": typeof types.CreateApplicationDocument,
    "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      __typename\n      id\n      status\n    }\n  }\n": typeof types.UpdateApplicationStatusDocument,
    "\n  query ApplicationDetail($id: ID!) {\n    application(id: $id) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n      interviews {\n        id\n        type\n        scheduledAt\n      }\n    }\n  }\n": typeof types.ApplicationDetailDocument,
    "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      application {\n        id\n        role\n        status\n        company {\n          id\n          name\n        }\n      }\n    }\n  }\n": typeof types.UpdateApplicationDocument,
    "\n  mutation AddInterview($input: AddInterviewInput!) {\n    addInterview(input: $input) {\n      id\n      type\n      scheduledAt\n      application {\n        id\n      }\n    }\n  }\n": typeof types.AddInterviewDocument,
    "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id) {\n      deletedApplicationId\n      deletedInterviewCount\n    }\n  }\n": typeof types.DeleteApplicationDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        role\n      }\n    }\n  }\n": typeof types.LoginDocument,
};
const documents: Documents = {
    "\n  query Dashboard(\n    $first: Int!\n    $after: String\n    $filter: ApplicationFilter\n  ) {\n    me {\n      id\n      email\n      role\n      applications {\n        id\n        status\n      }\n    }\n    applicationPage(first: $first, after: $after, filter: $filter) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          status\n          createdAt\n          company {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n": types.DashboardDocument,
    "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n    }\n  }\n": types.CreateApplicationDocument,
    "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      __typename\n      id\n      status\n    }\n  }\n": types.UpdateApplicationStatusDocument,
    "\n  query ApplicationDetail($id: ID!) {\n    application(id: $id) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n      interviews {\n        id\n        type\n        scheduledAt\n      }\n    }\n  }\n": types.ApplicationDetailDocument,
    "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      application {\n        id\n        role\n        status\n        company {\n          id\n          name\n        }\n      }\n    }\n  }\n": types.UpdateApplicationDocument,
    "\n  mutation AddInterview($input: AddInterviewInput!) {\n    addInterview(input: $input) {\n      id\n      type\n      scheduledAt\n      application {\n        id\n      }\n    }\n  }\n": types.AddInterviewDocument,
    "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id) {\n      deletedApplicationId\n      deletedInterviewCount\n    }\n  }\n": types.DeleteApplicationDocument,
    "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        role\n      }\n    }\n  }\n": types.LoginDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Dashboard(\n    $first: Int!\n    $after: String\n    $filter: ApplicationFilter\n  ) {\n    me {\n      id\n      email\n      role\n      applications {\n        id\n        status\n      }\n    }\n    applicationPage(first: $first, after: $after, filter: $filter) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          status\n          createdAt\n          company {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"): (typeof documents)["\n  query Dashboard(\n    $first: Int!\n    $after: String\n    $filter: ApplicationFilter\n  ) {\n    me {\n      id\n      email\n      role\n      applications {\n        id\n        status\n      }\n    }\n    applicationPage(first: $first, after: $after, filter: $filter) {\n      edges {\n        cursor\n        node {\n          id\n          role\n          status\n          createdAt\n          company {\n            id\n            name\n          }\n        }\n      }\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation CreateApplication($input: CreateApplicationInput!) {\n    createApplication(input: $input) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      __typename\n      id\n      status\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateApplicationStatus($id: ID!, $status: ApplicationStatus!) {\n    updateApplicationStatus(id: $id, status: $status) {\n      __typename\n      id\n      status\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ApplicationDetail($id: ID!) {\n    application(id: $id) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n      interviews {\n        id\n        type\n        scheduledAt\n      }\n    }\n  }\n"): (typeof documents)["\n  query ApplicationDetail($id: ID!) {\n    application(id: $id) {\n      id\n      role\n      status\n      createdAt\n      company {\n        id\n        name\n      }\n      interviews {\n        id\n        type\n        scheduledAt\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      application {\n        id\n        role\n        status\n        company {\n          id\n          name\n        }\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {\n    updateApplication(id: $id, input: $input) {\n      application {\n        id\n        role\n        status\n        company {\n          id\n          name\n        }\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddInterview($input: AddInterviewInput!) {\n    addInterview(input: $input) {\n      id\n      type\n      scheduledAt\n      application {\n        id\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation AddInterview($input: AddInterviewInput!) {\n    addInterview(input: $input) {\n      id\n      type\n      scheduledAt\n      application {\n        id\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id) {\n      deletedApplicationId\n      deletedInterviewCount\n    }\n  }\n"): (typeof documents)["\n  mutation DeleteApplication($id: ID!) {\n    deleteApplication(id: $id) {\n      deletedApplicationId\n      deletedInterviewCount\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        role\n      }\n    }\n  }\n"): (typeof documents)["\n  mutation Login($input: LoginInput!) {\n    login(input: $input) {\n      token\n      user {\n        id\n        email\n        role\n      }\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;