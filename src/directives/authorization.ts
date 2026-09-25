import { defaultFieldResolver, type GraphQLSchema } from "graphql";
import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";

import type { UserRole } from "../../generated/prisma/client.js";
import type { GraphQLContext } from "../context.js";
import { forbidden, unauthenticated } from "../errors.js";

export function authorizationDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const requiresAuthentication = Boolean(
        getDirective(schema, fieldConfig, "authenticated")?.length,
      );
      const roleDirective = getDirective(schema, fieldConfig, "requiresRole")?.[0];
      const requiredRole = roleDirective?.role as UserRole | undefined;

      if (!requiresAuthentication && !requiredRole) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = function (source, args, context: GraphQLContext, info) {
        if (!context.currentUser) throw unauthenticated();

        if (requiredRole && context.currentUser.role !== requiredRole) {
          throw forbidden(`The ${requiredRole} role is required.`);
        }

        return resolve(source, args, context, info);
      };

      return fieldConfig;
    },
  });
}
