export type RuntimeConfig = {
  clientOrigins: string[];
  nodeEnvironment: string;
  port: number;
  turnstileExpectedHostname?: string;
  turnstileSecretKey: string;
};

const DEVELOPMENT_TURNSTILE_SECRET =
  "1x0000000000000000000000000000000AA";

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

  if (nodeEnvironment === "production" && !environment.TURNSTILE_SECRET_KEY) {
    throw new Error("TURNSTILE_SECRET_KEY is required in production.");
  }

  const port = Number(environment.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const clientOrigins = configuredOrigins ?? ["http://localhost:5173"];
  const configuredTurnstileHostname =
    environment.TURNSTILE_EXPECTED_HOSTNAME?.trim();

  return {
    clientOrigins,
    nodeEnvironment,
    port,
    turnstileExpectedHostname:
      configuredTurnstileHostname ||
      (nodeEnvironment === "production"
        ? new URL(clientOrigins[0]).hostname
        : undefined),
    turnstileSecretKey:
      environment.TURNSTILE_SECRET_KEY ?? DEVELOPMENT_TURNSTILE_SECRET,
  };
}
