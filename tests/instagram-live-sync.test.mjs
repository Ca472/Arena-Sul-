import assert from "node:assert/strict";
import test from "node:test";

import {
  areInstagramStoriesEqual,
  findStoryIndexAfterRefresh,
  getAdjacentStoryIndex,
  getInstagramStoriesCacheBucket,
  getInstagramStoriesRefreshDelay,
  getInstagramStoriesSnapshotTimestamp,
  getStorySwipeDirection,
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

test("uses a fifteen-second near-live refresh with shared server protection", () => {
  assert.equal(INSTAGRAM_STORIES_REFRESH_MS, 15_000);
  assert.equal(INSTAGRAM_STORIES_MIN_REFRESH_MS, 5_000);
  assert.equal(INSTAGRAM_STORIES_SHARED_CACHE_SECONDS, 15);
  assert.ok(
    INSTAGRAM_STORIES_MIN_REFRESH_MS < INSTAGRAM_STORIES_REFRESH_MS,
  );
});

test("rotates the shared cache key at every near-live window", () => {
  assert.equal(getInstagramStoriesCacheBucket(0), 0);
  assert.equal(getInstagramStoriesCacheBucket(14_999), 0);
  assert.equal(getInstagramStoriesCacheBucket(15_000), 1);
  assert.equal(getInstagramStoriesCacheBucket(45_123), 3);
  assert.equal(getInstagramStoriesCacheBucket(-1), 0);
});

test("delays a fresh initial snapshot and refreshes when it becomes stale", () => {
  const now = 1_000_000;
  assert.equal(getInstagramStoriesRefreshDelay(now, now), 15_000);
  assert.equal(getInstagramStoriesRefreshDelay(now - 14_000, now), 1_000);
  assert.equal(getInstagramStoriesRefreshDelay(now - 15_000, now), 0);
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

test("navigates Stories in both directions with circular wrapping", () => {
  const stories = [story("1001"), story("1002"), story("1003")];
  assert.equal(getAdjacentStoryIndex("1002", stories, "next"), 2);
  assert.equal(getAdjacentStoryIndex("1002", stories, "previous"), 0);
  assert.equal(getAdjacentStoryIndex("1003", stories, "next"), 0);
  assert.equal(getAdjacentStoryIndex("1001", stories, "previous"), 2);
  assert.equal(getAdjacentStoryIndex("expired", stories, "next"), 1);
  assert.equal(getAdjacentStoryIndex(null, [], "next"), 0);
});

test("recognizes deliberate horizontal swipes without blocking vertical scroll", () => {
  assert.equal(getStorySwipeDirection(-80, 12), "next");
  assert.equal(getStorySwipeDirection(80, 12), "previous");
  assert.equal(getStorySwipeDirection(40, 2), null);
  assert.equal(getStorySwipeDirection(-80, 72), null);
  assert.equal(getStorySwipeDirection(10, 90), null);
});
