export type RuntimeConfig = {
  clientOrigins: string[];
  nodeEnvironment: string;
  port: number;
};

export function resolveRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): RuntimeConfig {
  const nodeEnvironment = environment.NODE_ENV ?? "development";
  const configuredOrigins = environment.CLIENT_ORIGIN
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnvironment === "production" && !configuredOrigins?.length) {
    throw new Error("CLIENT_ORIGIN is required in production.");
  }

  const port = Number(environment.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return {
    clientOrigins: configuredOrigins ?? ["http://localhost:5173"],
    nodeEnvironment,
    port,
  };
}
