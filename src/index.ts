import { expressMiddleware } from "@as-integrations/express5";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import cors from "cors";
import express from "express";
import { createServer as createHttpServer } from "node:http";

import { resolveRuntimeConfig } from "./config.js";
import { createContext } from "./context.js";
import { createPrismaClient } from "./db.js";
import { RegistrationRateLimiter } from "./registration-rate-limiter.js";
import { createServer } from "./server.js";
import { TurnstileVerifier } from "./turnstile.js";

const config = resolveRuntimeConfig();
const prisma = createPrismaClient();
const registrationRateLimiter = new RegistrationRateLimiter();
const turnstileVerifier = new TurnstileVerifier(
  config.turnstileSecretKey,
  config.turnstileExpectedHostname,
);
const app = express();
const httpServer = createHttpServer(app);
const server = createServer({}, [
  ApolloServerPluginDrainHttpServer({ httpServer }),
]);

app.disable("x-powered-by");
if (config.nodeEnvironment === "production") {
  app.set("trust proxy", 1);
}

app.get("/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get("/", (_request, response) => {
  response.redirect("/graphql");
});

await server.start();

app.use(
  "/graphql",
  cors({ origin: config.clientOrigins }),
  express.json(),
  expressMiddleware(server, {
    context: ({ req }) =>
      createContext(
        prisma,
        req.headers.authorization,
        req.ip ?? req.socket.remoteAddress ?? "unknown",
        registrationRateLimiter,
        turnstileVerifier,
      ),
  }),
);

await new Promise<void>((resolve, reject) => {
  httpServer.once("error", reject);
  httpServer.listen(config.port, "0.0.0.0", resolve);
});

console.log(`GraphQL API ready at http://localhost:${config.port}/graphql`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await server.stop();
    await prisma.$disconnect();
    process.exit(0);
  });
}
