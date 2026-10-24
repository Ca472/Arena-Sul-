import assert from "node:assert/strict";
import test from "node:test";
import { handleInstagramRenewalCron } from "../src/lib/instagram/renewal-handler.ts";
import { InstagramTokenRenewalError } from "../src/lib/instagram/token-renewal.ts";

const secret = "test-cron-secret-only-for-unit-tests";
function request(authorization) {
  return new Request("https://example.test/api/cron/instagram-renewal", {
    headers: authorization ? { authorization } : {},
  });
}

test("cron fails closed before any database or Meta call", async () => {
  for (const [configuredSecret, authorization] of [
    [undefined, "Bearer undefined"], ["", "Bearer "], [secret, undefined],
    [secret, `Bearer ${"x".repeat(secret.length)}`], [secret, `Bearer ${secret}x`],
  ]) {
    let called = false;
    const response = await handleInstagramRenewalCron(request(authorization), {
      secret: configuredSecret,
      renew: async () => { called = true; return { status: "not-due" }; },
    });
    assert.equal(response.status, 401);
    assert.equal(called, false);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});

test("authorized cron exposes only safe renewal metadata", async (t) => {
  const logs = [];
  t.mock.method(console, "info", (value) => logs.push(value));
  const result = { status: "refreshed", expiresAt: "2026-12-23T12:00:00Z" };
  const response = await handleInstagramRenewalCron(request(`Bearer ${secret}`), {
    secret, renew: async () => result,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), result);
  assert.equal(logs.length, 1);
  assert.ok(!logs[0].includes(secret));
});

test("expired authorization produces an actionable failure status", async (t) => {
  t.mock.method(console, "warn", () => {});
  const response = await handleInstagramRenewalCron(request(`Bearer ${secret}`), {
    secret, renew: async () => ({ status: "reauthorization-required" }),
  });
  assert.equal(response.status, 409);
});

test("failures return 500 and never expose the upstream token or URL", async (t) => {
  const logs = [];
  t.mock.method(console, "error", (value) => logs.push(value));
  for (const error of [
    new Error("https://graph.instagram.com/?access_token=PRIVATE"),
    new InstagramTokenRenewalError("request", 400),
  ]) {
    const response = await handleInstagramRenewalCron(request(`Bearer ${secret}`), {
      secret, renew: async () => { throw error; },
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: "renewal-failed" });
  }
  assert.ok(logs.every((line) => !line.includes("PRIVATE") && !line.includes("graph.instagram")));
});
