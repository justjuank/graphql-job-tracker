import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveRuntimeConfig } from "../src/config.js";

test("uses safe local server defaults", () => {
  assert.deepEqual(resolveRuntimeConfig({}), {
    clientOrigins: ["http://localhost:5173"],
    nodeEnvironment: "development",
    port: 4000,
  });
});

test("requires an explicit client origin in production", () => {
  assert.throws(
    () => resolveRuntimeConfig({ NODE_ENV: "production" }),
    /CLIENT_ORIGIN is required in production/,
  );
});

test("accepts multiple client origins and a hosting-provider port", () => {
  assert.deepEqual(
    resolveRuntimeConfig({
      CLIENT_ORIGIN: "https://job-tracker.example, https://admin.example",
      NODE_ENV: "production",
      PORT: "10000",
    }),
    {
      clientOrigins: [
        "https://job-tracker.example",
        "https://admin.example",
      ],
      nodeEnvironment: "production",
      port: 10000,
    },
  );
});

test("rejects invalid ports", () => {
  assert.throws(
    () => resolveRuntimeConfig({ PORT: "not-a-port" }),
    /PORT must be an integer/,
  );
});
