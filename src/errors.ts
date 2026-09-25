import { GraphQLError } from "graphql";

export function badUserInput(message: string): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

export function applicationNotFound(id: string): GraphQLError {
  return new GraphQLError(`Application ${id} was not found.`, {
    extensions: { code: "NOT_FOUND" },
  });
}

export function unauthenticated(): GraphQLError {
  return new GraphQLError("Authentication is required.", {
    extensions: { code: "UNAUTHENTICATED" },
  });
}

export function forbidden(message = "You do not have permission to access this field.") {
  return new GraphQLError(message, {
    extensions: { code: "FORBIDDEN" },
  });
}
