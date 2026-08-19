import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSET_WAIT_LIMIT_MS,
  LOGO_PHASE_DURATION_MS,
  OPENING_DURATION_MS,
  OVERLAY_EXIT_DELAY_MS,
  OVERLAY_EXIT_DURATION_MS,
  OVERLAY_FAILSAFE_MS,
  RACKET_PHASE_DURATION_MS,
} from "../src/lib/arena-opening-timeline.ts";

test("keeps the racket, logo and exit phases synchronized", () => {
  assert.equal(RACKET_PHASE_DURATION_MS, 4000);
  assert.equal(LOGO_PHASE_DURATION_MS, 2000);
  assert.equal(OVERLAY_EXIT_DELAY_MS, 6000);
  assert.equal(OVERLAY_EXIT_DURATION_MS, 600);
  assert.equal(OPENING_DURATION_MS, 6600);
});

test("keeps the CSS failsafe after the slowest valid opening", () => {
  assert.ok(
    OVERLAY_FAILSAFE_MS >= ASSET_WAIT_LIMIT_MS + OPENING_DURATION_MS,
  );
});
