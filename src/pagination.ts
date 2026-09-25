import { GraphQLError } from "graphql";

type ApplicationCursor = {
  id: string;
};

export function encodeApplicationCursor(id: string): string {
  const cursor: ApplicationCursor = { id };
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeApplicationCursor(cursor: string): ApplicationCursor {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("id" in decoded) ||
      typeof decoded.id !== "string" ||
      !decoded.id
    ) {
      throw new Error("Invalid cursor shape");
    }

    return { id: decoded.id };
  } catch {
    throw new GraphQLError("The pagination cursor is invalid.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}
