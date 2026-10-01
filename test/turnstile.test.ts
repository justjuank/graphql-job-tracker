import assert from "node:assert/strict";
import { test } from "node:test";

import { TurnstileVerifier } from "../src/turnstile.js";

test("accepts a successful registration challenge for the expected host", async () => {
  let submittedBody = "";
  const verifier = new TurnstileVerifier(
    "secret-key",
    "job-tracker.example",
    async (_input, init) => {
      submittedBody = String(init?.body);
      return Response.json({
        action: "register",
        hostname: "job-tracker.example",
        success: true,
      });
    },
  );

  assert.equal(await verifier.verify("browser-token", "203.0.113.10"), true);
  assert.equal(
    submittedBody,
    "remoteip=203.0.113.10&response=browser-token&secret=secret-key",
  );
});

test("rejects a token issued for another action or hostname", async () => {
  const wrongAction = new TurnstileVerifier(
    "secret-key",
    "job-tracker.example",
    async () =>
      Response.json({
        action: "login",
        hostname: "job-tracker.example",
        success: true,
      }),
  );
  const wrongHostname = new TurnstileVerifier(
    "secret-key",
    "job-tracker.example",
    async () =>
      Response.json({
        action: "register",
        hostname: "attacker.example",
        success: true,
      }),
  );

  assert.equal(await wrongAction.verify("browser-token", "203.0.113.10"), false);
  assert.equal(
    await wrongHostname.verify("browser-token", "203.0.113.10"),
    false,
  );
});

test("fails closed when Turnstile is unavailable", async () => {
  const verifier = new TurnstileVerifier(
    "secret-key",
    undefined,
    async () => {
      throw new Error("network unavailable");
    },
  );

  assert.equal(await verifier.verify("browser-token", "203.0.113.10"), false);
  assert.equal(await verifier.verify("", "203.0.113.10"), false);
});
