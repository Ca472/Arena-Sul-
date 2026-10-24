import assert from "node:assert/strict";
import test from "node:test";
import {
  getInstagramRenewalDecision,
  InstagramTokenRenewalError,
  refreshInstagramAccessToken,
  runInstagramTokenRenewal,
} from "../src/lib/instagram/token-renewal.ts";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-10-24T12:00:00Z");
const OLD_TOKEN = "old-private-instagram-token";
const NEW_TOKEN = "new-private-instagram-token";
const iso = (offset) => new Date(NOW + offset).toISOString();
const connection = (overrides = {}) => ({
  userId: "123",
  accessToken: OLD_TOKEN,
  expiresAt: iso(10 * DAY),
  lastRefreshedAt: iso(-50 * DAY),
  ciphertext: "original-ciphertext",
  ...overrides,
});

test("refresh window includes 30 days and excludes tokens younger than 24 hours", () => {
  assert.equal(getInstagramRenewalDecision(connection({ expiresAt: iso(30 * DAY) }), NOW), "due");
  assert.equal(getInstagramRenewalDecision(connection({ expiresAt: iso(30 * DAY + 1) }), NOW), "not-due");
  assert.equal(getInstagramRenewalDecision(connection({ lastRefreshedAt: iso(-DAY) }), NOW), "due");
  assert.equal(getInstagramRenewalDecision(connection({ lastRefreshedAt: iso(-DAY + 1) }), NOW), "too-recent");
});

test("expired and invalid dates never qualify for refresh", () => {
  assert.equal(getInstagramRenewalDecision(connection({ expiresAt: iso(0) }), NOW), "expired");
  assert.equal(getInstagramRenewalDecision(connection({ expiresAt: iso(-1) }), NOW), "expired");
  assert.equal(getInstagramRenewalDecision(connection({ expiresAt: "invalid" }), NOW), "invalid");
  assert.equal(getInstagramRenewalDecision(connection({ lastRefreshedAt: "invalid" }), NOW), "invalid");
  assert.equal(getInstagramRenewalDecision(connection({ lastRefreshedAt: iso(1) }), NOW), "invalid");
});

test("HTTP refresh uses official GET, avoids caching and persists Meta's actual lifetime", async () => {
  const result = await refreshInstagramAccessToken(OLD_TOKEN, {
    now: NOW,
    fetcher: async (url, options) => {
      assert.equal(url.origin + url.pathname, "https://graph.instagram.com/refresh_access_token");
      assert.equal(url.searchParams.get("grant_type"), "ig_refresh_token");
      assert.equal(url.searchParams.get("access_token"), OLD_TOKEN);
      assert.equal(options.method, "GET");
      assert.equal(options.cache, "no-store");
      assert.equal(options.redirect, "error");
      assert.ok(options.signal instanceof AbortSignal);
      return Response.json({ access_token: NEW_TOKEN, token_type: "bearer", expires_in: 5183944 });
    },
  });
  assert.deepEqual(result, { accessToken: NEW_TOKEN, expiresAt: iso(5183944 * 1000) });
});

test("network failures and upstream bodies cannot leak the token in errors", async () => {
  for (const fetcher of [
    async () => { throw new Error(`fetch https://graph.instagram.com/?access_token=${OLD_TOKEN}`); },
    async () => new Response(`upstream token ${OLD_TOKEN}`, { status: 400 }),
  ]) {
    await assert.rejects(refreshInstagramAccessToken(OLD_TOKEN, { now: NOW, fetcher }), (error) => {
      assert.ok(error instanceof InstagramTokenRenewalError);
      assert.equal(error.stage, "request");
      assert.equal(error.cause, undefined);
      assert.equal(`${error.stack} ${JSON.stringify(error)}`.includes(OLD_TOKEN), false);
      return true;
    });
  }
});

test("HTTP refresh rejects malformed and unusable responses", async () => {
  for (const payload of [
    null,
    {},
    { access_token: "short", expires_in: 100 },
    { access_token: NEW_TOKEN, expires_in: 0 },
    { access_token: NEW_TOKEN, expires_in: "5184000" },
    { access_token: NEW_TOKEN, expires_in: 1.5 },
    { access_token: NEW_TOKEN, expires_in: Number.MAX_SAFE_INTEGER },
    { access_token: NEW_TOKEN, expires_in: 100, token_type: "other" },
  ]) {
    await assert.rejects(
      refreshInstagramAccessToken(OLD_TOKEN, { now: NOW, fetcher: async () => Response.json(payload) }),
      (error) => error instanceof InstagramTokenRenewalError && error.stage === "response",
    );
  }
  await assert.rejects(
    refreshInstagramAccessToken(OLD_TOKEN, { now: NOW, fetcher: async () => new Response("not-json") }),
    (error) => error.stage === "response",
  );
});

test("coordinator never calls Meta or writes for missing, expired, fresh or young connections", async () => {
  for (const [stored, status] of [
    [null, "not-connected"],
    [connection({ expiresAt: iso(-1) }), "reauthorization-required"],
    [connection({ expiresAt: iso(40 * DAY) }), "not-due"],
    [connection({ lastRefreshedAt: iso(-DAY + 1) }), "too-recent"],
  ]) {
    const result = await runInstagramTokenRenewal({
      readConnection: async () => stored,
      refresh: async () => { assert.fail("must not call Meta"); },
      persist: async () => { assert.fail("must not persist"); },
    }, NOW);
    assert.deepEqual(result, { status });
  }
});

test("coordinator passes the original revision to persistence and returns a safe result", async () => {
  const original = connection();
  let writes = 0;
  const result = await runInstagramTokenRenewal({
    readConnection: async () => original,
    refresh: async (token) => {
      assert.equal(token, OLD_TOKEN);
      return { accessToken: NEW_TOKEN, expiresAt: iso(60 * DAY) };
    },
    persist: async (expected, refreshed) => {
      assert.equal(expected, original);
      assert.equal(expected.ciphertext, "original-ciphertext");
      assert.equal(refreshed.accessToken, NEW_TOKEN);
      writes += 1;
      return true;
    },
  }, NOW);
  assert.equal(writes, 1);
  assert.deepEqual(result, { status: "refreshed", expiresAt: iso(60 * DAY) });
  assert.equal(JSON.stringify(result).includes("private"), false);
});

test("a reconnect during refresh wins over the stale job through compare-and-swap", async () => {
  let stored = connection();
  const result = await runInstagramTokenRenewal({
    readConnection: async () => stored,
    refresh: async () => {
      stored = connection({ ciphertext: "reconnected-ciphertext", accessToken: "human-reconnected-token" });
      return { accessToken: NEW_TOKEN, expiresAt: iso(60 * DAY) };
    },
    persist: async (original, refreshed) => {
      if (original.ciphertext !== stored.ciphertext) return false;
      stored = { ...stored, ...refreshed };
      return true;
    },
  }, NOW);
  assert.deepEqual(result, { status: "superseded" });
  assert.equal(stored.accessToken, "human-reconnected-token");
});

test("read, refresh and storage failures are sanitized and never report success", async () => {
  for (const stage of ["read", "request", "storage"]) {
    let writes = 0;
    const fail = () => { throw new Error(OLD_TOKEN); };
    await assert.rejects(runInstagramTokenRenewal({
      readConnection: async () => stage === "read" ? fail() : connection(),
      refresh: async () => stage === "request" ? fail() : { accessToken: NEW_TOKEN, expiresAt: iso(60 * DAY) },
      persist: async () => { writes += 1; return fail(); },
    }, NOW), (error) => {
      assert.ok(error instanceof InstagramTokenRenewalError);
      assert.equal(error.stage, stage);
      assert.equal(error.message.includes(OLD_TOKEN), false);
      return true;
    });
    assert.equal(writes, stage === "storage" ? 1 : 0);
  }
});

test("invalid metadata and an injected invalid token cannot reach persistence", async () => {
  await assert.rejects(runInstagramTokenRenewal({
    readConnection: async () => connection({ lastRefreshedAt: "bad" }),
    persist: async () => { assert.fail("must not persist"); },
  }, NOW), (error) => error.stage === "configuration");
  for (const refreshed of [
    null,
    { accessToken: NEW_TOKEN, expiresAt: iso(-1) },
    { accessToken: NEW_TOKEN, expiresAt: iso(DAY) },
  ]) {
    await assert.rejects(runInstagramTokenRenewal({
      readConnection: async () => connection(),
      refresh: async () => refreshed,
      persist: async () => { assert.fail("must not persist"); },
    }, NOW), (error) => error.stage === "response");
  }
});
