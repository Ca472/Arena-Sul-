import assert from "node:assert/strict";
import test from "node:test";

import {
  areInstagramStoriesEqual,
  findStoryIndexAfterRefresh,
  getInstagramStoriesRefreshDelay,
  getInstagramStoriesSnapshotTimestamp,
  INSTAGRAM_STORIES_MIN_REFRESH_MS,
  INSTAGRAM_STORIES_REFRESH_MS,
  INSTAGRAM_STORIES_SHARED_CACHE_SECONDS,
  isInstagramStoriesSnapshot,
} from "../src/lib/instagram/live-sync.ts";

function story(id, overrides = {}) {
  return {
    id,
    kind: "story",
    mediaType: "IMAGE",
    mediaUrl: `https://example.cdninstagram.com/${id}.jpg`,
    thumbnailUrl: null,
    permalink: "https://www.instagram.com/stories/arenasulsports/",
    caption: null,
    timestamp: "2026-08-19T15:00:00.000Z",
    ...overrides,
  };
}

const fetchedAt = "2026-08-19T15:01:00.000Z";

test("uses a thirty-second visible refresh with shared server protection", () => {
  assert.equal(INSTAGRAM_STORIES_REFRESH_MS, 30_000);
  assert.equal(INSTAGRAM_STORIES_MIN_REFRESH_MS, 30_000);
  assert.equal(INSTAGRAM_STORIES_SHARED_CACHE_SECONDS, 25);
  assert.ok(
    INSTAGRAM_STORIES_MIN_REFRESH_MS >=
      INSTAGRAM_STORIES_SHARED_CACHE_SECONDS * 1000,
  );
});

test("delays a fresh initial snapshot and refreshes when it becomes stale", () => {
  const now = 1_000_000;
  assert.equal(getInstagramStoriesRefreshDelay(now, now), 30_000);
  assert.equal(getInstagramStoriesRefreshDelay(now - 29_000, now), 1_000);
  assert.equal(getInstagramStoriesRefreshDelay(now - 30_000, now), 0);
  assert.equal(getInstagramStoriesRefreshDelay(0, now), 0);
});

test("accepts only a sanitized Stories snapshot", () => {
  assert.equal(
    isInstagramStoriesSnapshot({
      status: "connected",
      stories: [story("1001")],
      fetchedAt,
    }),
    true,
  );
  assert.equal(
    isInstagramStoriesSnapshot({
      status: "connected",
      stories: [story("1001", { kind: "reel" })],
      fetchedAt,
    }),
    false,
  );
  assert.equal(
    isInstagramStoriesSnapshot({
      status: "connected",
      stories: [],
      fetchedAt,
      token: "x",
    }),
    false,
  );
  assert.equal(isInstagramStoriesSnapshot({ status: "connected" }), false);
  assert.equal(
    isInstagramStoriesSnapshot({
      status: "connected",
      stories: [],
      fetchedAt: "not-a-date",
    }),
    false,
  );
});

test("orders snapshots by their server fetch time", () => {
  assert.equal(
    getInstagramStoriesSnapshotTimestamp("2026-08-19T15:01:00.000Z"),
    Date.parse("2026-08-19T15:01:00.000Z"),
  );
  assert.equal(getInstagramStoriesSnapshotTimestamp(null), 0);
  assert.equal(getInstagramStoriesSnapshotTimestamp("not-a-date"), 0);
});

test("detects changes without restarting for an identical snapshot", () => {
  const current = [story("1001"), story("1002")];
  assert.equal(areInstagramStoriesEqual(current, [...current]), true);
  assert.equal(
    areInstagramStoriesEqual(current, [story("1002"), story("1001")]),
    false,
  );
  assert.equal(
    areInstagramStoriesEqual(current, [
      story("1001", { mediaUrl: "https://example.cdninstagram.com/new.jpg" }),
      story("1002"),
    ]),
    false,
  );
});

test("keeps the active Story by id and falls back to the first available one", () => {
  const refreshed = [story("1003"), story("1002"), story("1001")];
  assert.equal(findStoryIndexAfterRefresh("1002", refreshed), 1);
  assert.equal(findStoryIndexAfterRefresh("expired", refreshed), 0);
  assert.equal(findStoryIndexAfterRefresh(null, refreshed), 0);
  assert.equal(findStoryIndexAfterRefresh("1002", []), 0);
});
