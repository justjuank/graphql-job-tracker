import { ApolloServer } from "@apollo/server";
import { depthLimit } from "@graphile/depth-limit";
import { makeExecutableSchema } from "@graphql-tools/schema";

import type { GraphQLContext } from "./context.js";
import { authorizationDirectiveTransformer } from "./directives/authorization.js";
import {
  queryComplexityPlugin,
  resolveQueryProtectionOptions,
  type QueryProtectionOptions,
} from "./query-protection.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export function createServer(overrides: Partial<QueryProtectionOptions> = {}) {
  const protection = resolveQueryProtectionOptions(overrides);
  const schema = authorizationDirectiveTransformer(makeExecutableSchema({
    typeDefs,
    resolvers,
  }));

  return new ApolloServer<GraphQLContext>({
    schema,
    maxRecursiveSelections: protection.maxQueryNodes,
    validationRules: [
      depthLimit({
        maxDepth: protection.maxDepth,
        maxListDepth: protection.maxListDepth,
        maxSelfReferentialDepth: protection.maxSelfReferentialDepth,
        revealDetails: process.env.NODE_ENV !== "production",
      }),
    ],
    plugins: [queryComplexityPlugin(schema, protection)],
  });
}
