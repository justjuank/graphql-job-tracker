import type { ApolloServerPlugin } from "@apollo/server";
import {
  GraphQLError,
  Kind,
  type GraphQLSchema,
  type OperationDefinitionNode,
} from "graphql";
import {
  getComplexity,
  simpleEstimator,
  type ComplexityEstimator,
} from "graphql-query-complexity";

import type { GraphQLContext } from "./context.js";

export type QueryProtectionOptions = {
  maxComplexity: number;
  maxDepth: number;
  maxListDepth: number;
  maxQueryNodes: number;
  maxSelfReferentialDepth: number;
};

export const defaultQueryProtectionOptions: QueryProtectionOptions = {
  maxComplexity: 200,
  maxDepth: 8,
  maxListDepth: 3,
  maxQueryNodes: 1_000,
  maxSelfReferentialDepth: 2,
};

const listMultipliers: Record<string, number> = {
  "Company.applications": 20,
  "JobApplication.interviews": 5,
  "Query.applications": 20,
  "Query.users": 20,
  "User.applications": 20,
};

function positiveInteger(
  environment: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
): number {
  const raw = environment[key];
  if (raw === undefined || raw === "") return fallback;

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

export function queryProtectionOptionsFromEnvironment(
  environment: NodeJS.ProcessEnv = process.env,
): QueryProtectionOptions {
  return {
    maxComplexity: positiveInteger(
      environment,
      "GRAPHQL_MAX_COMPLEXITY",
      defaultQueryProtectionOptions.maxComplexity,
    ),
    maxDepth: positiveInteger(
      environment,
      "GRAPHQL_MAX_DEPTH",
      defaultQueryProtectionOptions.maxDepth,
    ),
    maxListDepth: positiveInteger(
      environment,
      "GRAPHQL_MAX_LIST_DEPTH",
      defaultQueryProtectionOptions.maxListDepth,
    ),
    maxQueryNodes: positiveInteger(
      environment,
      "GRAPHQL_MAX_QUERY_NODES",
      defaultQueryProtectionOptions.maxQueryNodes,
    ),
    maxSelfReferentialDepth: positiveInteger(
      environment,
      "GRAPHQL_MAX_SELF_REFERENTIAL_DEPTH",
      defaultQueryProtectionOptions.maxSelfReferentialDepth,
    ),
  };
}

export function resolveQueryProtectionOptions(
  overrides: Partial<QueryProtectionOptions> = {},
): QueryProtectionOptions {
  return {
    ...queryProtectionOptionsFromEnvironment(),
    ...overrides,
  };
}

const connectionAndListEstimator: ComplexityEstimator = ({
  args,
  childComplexity,
  field,
  type,
}) => {
  const coordinate = `${type.name}.${field.name}`;

  // The connection's `first` argument represents its maximum result size.
  // `edges` itself is not multiplied again, which avoids counting the page twice.
  if (coordinate === "Query.applicationPage") {
    const pageSize = typeof args.first === "number" ? args.first : 10;
    return 1 + pageSize * childComplexity;
  }

  if (coordinate === "ApplicationConnection.edges") {
    return 1 + childComplexity;
  }

  const multiplier = listMultipliers[coordinate];
  return multiplier === undefined
    ? undefined
    : 1 + multiplier * childComplexity;
};

function isIntrospectionOnly(operation: OperationDefinitionNode): boolean {
  return operation.selectionSet.selections.every(
    (selection) =>
      selection.kind === Kind.FIELD && selection.name.value.startsWith("__"),
  );
}

export function queryComplexityPlugin(
  schema: GraphQLSchema,
  options: QueryProtectionOptions,
): ApolloServerPlugin<GraphQLContext> {
  return {
    async requestDidStart() {
      return {
        async didResolveOperation(requestContext) {
          // Introspection has dedicated depth limits and must remain available to
          // Apollo Sandbox and Postman's schema autocomplete.
          if (
            requestContext.operation &&
            isIntrospectionOnly(requestContext.operation)
          ) {
            return;
          }

          const complexity = getComplexity({
            schema,
            query: requestContext.document,
            variables: requestContext.request.variables,
            operationName: requestContext.operationName ?? undefined,
            maxQueryNodes: options.maxQueryNodes,
            estimators: [
              connectionAndListEstimator,
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          });

          if (complexity > options.maxComplexity) {
            throw new GraphQLError(
              `Query complexity ${complexity} exceeds the maximum of ${options.maxComplexity}.`,
              {
                extensions: {
                  code: "QUERY_TOO_COMPLEX",
                  complexity,
                  maxComplexity: options.maxComplexity,
                  http: { status: 400 },
                },
              },
            );
          }
        },
      };
    },
  };
}
