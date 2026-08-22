import assert from "node:assert/strict";
import test from "node:test";

import { isTrustedInstagramOAuthStartRequest } from "../src/lib/instagram/request-origin.ts";

const PORTAL_ORIGIN = "https://www.arenasulsports.com";
const PORTAL_HOST = new URL(PORTAL_ORIGIN).host;
const LEGACY_PORTAL_ORIGIN = "https://arena-sul-portal.vercel.app";

function request(headers = {}, protocol = "https:") {
  return {
    headers: new Headers(headers),
    nextUrl: { protocol },
  };
}

test("accepts the normal POST when Origin matches exactly", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({ origin: PORTAL_ORIGIN }),
      PORTAL_ORIGIN,
    ),
    true,
  );
});

test("rejects a present mismatched Origin without using fallback signals", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        origin: "https://attacker.example",
        host: PORTAL_HOST,
        "sec-fetch-site": "same-origin",
        "x-forwarded-proto": "https",
      }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});

test("accepts an opaque Origin only with complete same-origin navigation metadata", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        origin: "null",
        host: PORTAL_HOST,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
      }),
      PORTAL_ORIGIN,
    ),
    true,
  );
});

test("accepts an originless same-origin POST for the configured Host", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        host: PORTAL_HOST,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
      }),
      PORTAL_ORIGIN,
    ),
    true,
  );
});

test("accepts the trusted forwarded host and protocol from a reverse proxy", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        host: "internal-runtime.local",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "x-forwarded-host": PORTAL_HOST,
        "x-forwarded-proto": "https",
      }),
      PORTAL_ORIGIN,
    ),
    true,
  );
});

for (const fetchSite of [undefined, "same-site", "cross-site", "none"]) {
  test(`rejects an originless POST with Sec-Fetch-Site ${fetchSite ?? "missing"}`, () => {
    const headers = {
      host: PORTAL_HOST,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
    };
    if (fetchSite) {
      headers["sec-fetch-site"] = fetchSite;
    }

    assert.equal(
      isTrustedInstagramOAuthStartRequest(request(headers), PORTAL_ORIGIN),
      false,
    );
  });
}

for (const [header, value] of [
  ["sec-fetch-mode", undefined],
  ["sec-fetch-mode", "cors"],
  ["sec-fetch-dest", undefined],
  ["sec-fetch-dest", "empty"],
]) {
  test(`rejects an originless POST with ${header} ${value ?? "missing"}`, () => {
    const headers = {
      host: PORTAL_HOST,
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
    };

    if (value) {
      headers[header] = value;
    } else {
      delete headers[header];
    }

    assert.equal(
      isTrustedInstagramOAuthStartRequest(request(headers), PORTAL_ORIGIN),
      false,
    );
  });
}

test("rejects an originless POST for a different Host", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        host: "attacker.example",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
      }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});

test("rejects a mismatched forwarded Host even if Host itself matches", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        host: PORTAL_HOST,
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});

test("rejects ambiguous forwarded Host chains", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "x-forwarded-host": `${PORTAL_HOST}, attacker.example`,
        "x-forwarded-proto": "https",
      }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});

test("rejects an originless POST forwarded over a different protocol", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "x-forwarded-host": PORTAL_HOST,
        "x-forwarded-proto": "http",
      }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});

test("rejects the request when the portal origin is not configured", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({ origin: PORTAL_ORIGIN }),
      null,
    ),
    false,
  );
});

test("rejects the former Vercel origin after the custom-domain cutover", () => {
  assert.equal(
    isTrustedInstagramOAuthStartRequest(
      request({ origin: LEGACY_PORTAL_ORIGIN }),
      PORTAL_ORIGIN,
    ),
    false,
  );
});
