import assert from "node:assert/strict";
import test from "node:test";

import {
  areInstagramMediaItemsEqual,
  findStoryIndexAfterRefresh,
  getAdjacentStoryIndex,
  getInstagramLiveCacheBucket,
  getInstagramLiveRefreshDelay,
  getInstagramLiveSnapshotTimestamp,
  getStorySwipeDirection,
  INSTAGRAM_LIVE_MIN_REFRESH_MS,
  INSTAGRAM_LIVE_REFRESH_MS,
  INSTAGRAM_LIVE_SHARED_CACHE_SECONDS,
  isInstagramLiveFeedSnapshot,
  mergeInstagramFeedMedia,
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

function reel(id, overrides = {}) {
  return {
    id,
    kind: "reel",
    mediaType: "VIDEO",
    mediaUrl: `https://example.cdninstagram.com/${id}.mp4`,
    thumbnailUrl: `https://example.cdninstagram.com/${id}.jpg`,
    permalink: `https://www.instagram.com/reel/${id}/`,
    caption: `Reel ${id}`,
    timestamp: "2026-08-19T15:00:00.000Z",
    ...overrides,
  };
}

const fetchedAt = "2026-08-19T15:01:00.000Z";

test("uses a fifteen-second near-live refresh for Stories and Reels", () => {
  assert.equal(INSTAGRAM_LIVE_REFRESH_MS, 15_000);
  assert.equal(INSTAGRAM_LIVE_MIN_REFRESH_MS, 5_000);
  assert.equal(INSTAGRAM_LIVE_SHARED_CACHE_SECONDS, 15);
  assert.ok(INSTAGRAM_LIVE_MIN_REFRESH_MS < INSTAGRAM_LIVE_REFRESH_MS);
});

test("rotates the shared cache key at every near-live window", () => {
  assert.equal(getInstagramLiveCacheBucket(0), 0);
  assert.equal(getInstagramLiveCacheBucket(14_999), 0);
  assert.equal(getInstagramLiveCacheBucket(15_000), 1);
  assert.equal(getInstagramLiveCacheBucket(45_123), 3);
  assert.equal(getInstagramLiveCacheBucket(-1), 0);
});

test("delays a fresh initial snapshot and refreshes when it becomes stale", () => {
  const now = 1_000_000;
  assert.equal(getInstagramLiveRefreshDelay(now, now), 15_000);
  assert.equal(getInstagramLiveRefreshDelay(now - 14_000, now), 1_000);
  assert.equal(getInstagramLiveRefreshDelay(now - 15_000, now), 0);
  assert.equal(getInstagramLiveRefreshDelay(0, now), 0);
});

test("accepts only a sanitized live snapshot with Stories and Reels", () => {
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "connected",
      reelsStatus: "connected",
      stories: [story("1001")],
      reels: [reel("2001")],
      fetchedAt,
    }),
    true,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "unavailable",
      reelsStatus: "connected",
      stories: [],
      reels: [reel("2001")],
      fetchedAt,
    }),
    true,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "connected",
      reelsStatus: "connected",
      stories: [story("1001", { kind: "reel" })],
      reels: [reel("2001")],
      fetchedAt,
    }),
    false,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "unconfigured",
      reelsStatus: "connected",
      stories: [],
      reels: [reel("2001")],
      fetchedAt,
    }),
    false,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "connected",
      reelsStatus: "connected",
      stories: [story("1001")],
      reels: [reel("2001", { kind: "story" })],
      fetchedAt,
    }),
    false,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "connected",
      reelsStatus: "connected",
      stories: [story("1001")],
      reels: [reel("2001")],
      fetchedAt,
      token: "x",
    }),
    false,
  );
  assert.equal(isInstagramLiveFeedSnapshot({ status: "connected" }), false);
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "unavailable",
      reelsStatus: "unavailable",
      stories: [],
      reels: [],
      fetchedAt,
    }),
    false,
  );
  assert.equal(
    isInstagramLiveFeedSnapshot({
      status: "connected",
      storiesStatus: "connected",
      reelsStatus: "connected",
      stories: [],
      reels: [],
      fetchedAt: "not-a-date",
    }),
    false,
  );
});

test("orders snapshots by their server fetch time", () => {
  assert.equal(
    getInstagramLiveSnapshotTimestamp("2026-08-19T15:01:00.000Z"),
    Date.parse("2026-08-19T15:01:00.000Z"),
  );
  assert.equal(getInstagramLiveSnapshotTimestamp(null), 0);
  assert.equal(getInstagramLiveSnapshotTimestamp("not-a-date"), 0);
});

test("detects Story changes without restarting for an identical list", () => {
  const current = [story("1001"), story("1002")];
  assert.equal(areInstagramMediaItemsEqual(current, [...current]), true);
  assert.equal(
    areInstagramMediaItemsEqual(current, [story("1002"), story("1001")]),
    false,
  );
  assert.equal(
    areInstagramMediaItemsEqual(current, [
      story("1001", { mediaUrl: "https://example.cdninstagram.com/new.jpg" }),
      story("1002"),
    ]),
    false,
  );
});

test("detects new, removed, reordered, or edited Reels", () => {
  const current = [reel("2001"), reel("2002")];
  assert.equal(areInstagramMediaItemsEqual(current, [...current]), true);
  assert.equal(
    areInstagramMediaItemsEqual(current, [reel("2002"), reel("2001")]),
    false,
  );
  assert.equal(areInstagramMediaItemsEqual(current, [reel("2001")]), false);
  assert.equal(
    areInstagramMediaItemsEqual(current, [reel("2003"), ...current]),
    false,
  );
  assert.equal(
    areInstagramMediaItemsEqual(current, [
      reel("2001", { caption: "Legenda atualizada" }),
      reel("2002"),
    ]),
    false,
  );
});

test("preserves a failed edge and adopts it after recovery", () => {
  const current = {
    stories: [story("1001")],
    reels: [reel("2001")],
  };
  const partialSnapshot = {
    status: "connected",
    storiesStatus: "unavailable",
    reelsStatus: "connected",
    stories: [],
    reels: [reel("2002")],
    fetchedAt,
  };

  const partial = mergeInstagramFeedMedia(current, partialSnapshot);
  assert.deepEqual(partial.stories, current.stories);
  assert.deepEqual(partial.reels, [reel("2002")]);

  const recovered = mergeInstagramFeedMedia(partial, {
    ...partialSnapshot,
    storiesStatus: "connected",
    stories: [story("1002")],
  });
  assert.deepEqual(recovered.stories, [story("1002")]);
  assert.deepEqual(recovered.reels, [reel("2002")]);
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
