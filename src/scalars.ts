import { GraphQLError, GraphQLScalarType, Kind } from "graphql";

const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function invalidDateTime(): GraphQLError {
  return new GraphQLError("DateTime must be a valid ISO-8601 date-time string.", {
    extensions: { code: "BAD_USER_INPUT" },
  });
}

function parseDateTime(value: unknown): Date {
  if (typeof value !== "string") {
    throw invalidDateTime();
  }

  if (!ISO_DATE_TIME.test(value)) {
    throw invalidDateTime();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw invalidDateTime();
  }

  return date;
}

export const dateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "An ISO-8601 date and time, normalized to UTC in responses.",

  serialize(value): string {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new GraphQLError("DateTime cannot serialize a non-Date value.");
    }

    return value.toISOString();
  },

  parseValue: parseDateTime,

  parseLiteral(node): Date {
    if (node.kind !== Kind.STRING) {
      throw invalidDateTime();
    }

    return parseDateTime(node.value);
  },
});
