import assert from "node:assert/strict";
import test from "node:test";

import { resolveInstagramAdminConnectionStatus } from "../src/lib/instagram/admin-status.ts";

const healthyConnection = {
  oauthReady: true,
  hasConnection: true,
  expired: false,
  hasCredentials: true,
  liveStatus: "connected",
};

test("reports connected only after a live Meta API validation", () => {
  assert.equal(
    resolveInstagramAdminConnectionStatus(healthyConnection),
    "connected",
  );
  assert.equal(
    resolveInstagramAdminConnectionStatus({
      ...healthyConnection,
      liveStatus: "unavailable",
    }),
    "api-unavailable",
  );
});

test("keeps token storage failures separate from Meta API failures", () => {
  assert.equal(
    resolveInstagramAdminConnectionStatus({
      ...healthyConnection,
      hasCredentials: false,
      liveStatus: "unconfigured",
    }),
    "credentials-unavailable",
  );
});

test("prioritizes expiry before attempting to describe API health", () => {
  assert.equal(
    resolveInstagramAdminConnectionStatus({
      ...healthyConnection,
      expired: true,
      liveStatus: "unavailable",
    }),
    "expired",
  );
});

test("distinguishes a pending invitation from incomplete configuration", () => {
  assert.equal(
    resolveInstagramAdminConnectionStatus({
      ...healthyConnection,
      hasConnection: false,
      hasCredentials: false,
      liveStatus: "unconfigured",
    }),
    "awaiting-authorization",
  );
  assert.equal(
    resolveInstagramAdminConnectionStatus({
      ...healthyConnection,
      oauthReady: false,
      hasConnection: false,
      hasCredentials: false,
      liveStatus: "unconfigured",
    }),
    "unconfigured",
  );
});
