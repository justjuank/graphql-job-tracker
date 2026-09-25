import { ApolloServer } from "@apollo/server";
import { makeExecutableSchema } from "@graphql-tools/schema";

import type { GraphQLContext } from "./context.js";
import { authorizationDirectiveTransformer } from "./directives/authorization.js";
import { resolvers } from "./resolvers.js";
import { typeDefs } from "./schema.js";

export function createServer() {
  const schema = authorizationDirectiveTransformer(makeExecutableSchema({
    typeDefs,
    resolvers,
  }));

  return new ApolloServer<GraphQLContext>({ schema });
}
