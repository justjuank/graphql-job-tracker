import { startStandaloneServer } from "@apollo/server/standalone";

import { createContext } from "./context.js";
import { createPrismaClient } from "./db.js";
import { createServer } from "./server.js";

const prisma = createPrismaClient();
const server = createServer();

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
  context: ({ req }) => createContext(prisma, req.headers.authorization),
});

console.log(`GraphQL API ready at ${url}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
