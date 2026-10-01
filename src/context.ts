import type { UserRole } from "../generated/prisma/client.js";
import { authenticateBearerToken } from "./auth.js";
import type { DatabaseClient } from "./db.js";
import { createLoaders, type Loaders } from "./loaders.js";
import type { RegistrationRateLimiter } from "./registration-rate-limiter.js";
import { ApplicationService } from "./services/application-service.js";

export type CurrentUser = {
  id: string;
  role: UserRole;
};

export type GraphQLContext = {
  currentUser: CurrentUser | null;
  loaders: Loaders;
  prisma: DatabaseClient;
  request: {
    ip: string;
  };
  services: {
    applications: ApplicationService;
    registrationRateLimiter: RegistrationRateLimiter;
  };
};

export async function createContext(
  prisma: DatabaseClient,
  authorizationHeader: string | undefined,
  clientIp: string,
  registrationRateLimiter: RegistrationRateLimiter,
): Promise<GraphQLContext> {
  const userId = await authenticateBearerToken(authorizationHeader);
  const currentUser = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      })
    : null;

  return {
    currentUser,
    prisma,
    request: { ip: clientIp },
    loaders: createLoaders(prisma, currentUser?.id ?? ""),
    services: {
      applications: new ApplicationService(prisma),
      registrationRateLimiter,
    },
  };
}
