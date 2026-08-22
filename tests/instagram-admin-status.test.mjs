import assert from "node:assert/strict";
import test from "node:test";

import {
  getInstagramExpiryCountdown,
  resolveInstagramAdminConnectionStatus,
} from "../src/lib/instagram/admin-status.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const NOW_MS = Date.parse("2026-08-22T12:00:00.000Z");

function expiresAfter(durationMs) {
  return new Date(NOW_MS + durationMs).toISOString();
}

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

test("uses the stored expiry date and formats a readable countdown", () => {
  assert.deepEqual(
    getInstagramExpiryCountdown(
      expiresAfter(45 * DAY_MS + 3 * HOUR_MS + 12 * MINUTE_MS),
      NOW_MS,
    ),
    {
      level: "healthy",
      label: "45 dias, 3 horas, 12 minutos",
      remainingMs: 45 * DAY_MS + 3 * HOUR_MS + 12 * MINUTE_MS,
      shouldRenew: false,
    },
  );
});

test("starts the preventive renewal warning at 30 days", () => {
  assert.equal(
    getInstagramExpiryCountdown(expiresAfter(30 * DAY_MS), NOW_MS).level,
    "attention",
  );
  assert.equal(
    getInstagramExpiryCountdown(expiresAfter(30 * DAY_MS + MINUTE_MS), NOW_MS)
      .level,
    "healthy",
  );
});

test("escalates the expiry warning at 7 days", () => {
  const urgent = getInstagramExpiryCountdown(
    expiresAfter(7 * DAY_MS),
    NOW_MS,
  );

  assert.equal(urgent.level, "urgent");
  assert.equal(urgent.label, "7 dias");
  assert.equal(urgent.shouldRenew, true);
});

test("rounds a partial final minute up instead of showing zero", () => {
  const countdown = getInstagramExpiryCountdown(
    expiresAfter(20 * 1000),
    NOW_MS,
  );

  assert.equal(countdown.label, "1 minuto");
  assert.equal(countdown.level, "urgent");
});

test("reports expired and unavailable expiry dates safely", () => {
  assert.deepEqual(
    getInstagramExpiryCountdown(
      new Date(NOW_MS - MINUTE_MS).toISOString(),
      NOW_MS,
    ),
    {
      level: "expired",
      label: "Autorização expirada",
      remainingMs: 0,
      shouldRenew: true,
    },
  );
  assert.deepEqual(getInstagramExpiryCountdown("not-a-date", NOW_MS), {
    level: "unavailable",
    label: "Data de expiração indisponível",
    remainingMs: null,
    shouldRenew: true,
  });
});
