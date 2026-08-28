import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeInstagramMedia,
  selectInstagramReels,
} from "../src/lib/instagram/media-normalization.ts";

function graphReel(id, overrides = {}) {
  return {
    id,
    caption: `Reel ${id}`,
    media_type: "VIDEO",
    media_product_type: "REELS",
    media_url: `https://video.cdninstagram.com/${id}.mp4`,
    thumbnail_url: `https://images.cdninstagram.com/${id}.jpg`,
    permalink: `https://www.instagram.com/reel/${id}/`,
    timestamp: "2026-08-22T15:00:00.000Z",
    ...overrides,
  };
}

test("keeps a Reel preview when Meta omits the direct video URL", () => {
  const normalized = normalizeInstagramMedia(
    graphReel("protected-audio", { media_url: undefined }),
    "reel",
  );

  assert.ok(normalized);
  assert.equal(normalized.mediaType, "VIDEO");
  assert.equal(normalized.mediaUrl, null);
  assert.equal(
    normalized.thumbnailUrl,
    "https://images.cdninstagram.com/protected-audio.jpg",
  );
  assert.equal(
    normalized.permalink,
    "https://www.instagram.com/reel/protected-audio/",
  );
});

test("rejects media when neither a safe video nor a safe thumbnail is available", () => {
  assert.equal(
    normalizeInstagramMedia(
      graphReel("no-preview", {
        media_url: undefined,
        thumbnail_url: undefined,
      }),
      "reel",
    ),
    null,
  );
});

test("recognizes Reel permalinks when media_product_type is unavailable", () => {
  const selected = selectInstagramReels([
    graphReel("permalink-fallback", { media_product_type: undefined }),
    graphReel("regular-feed", {
      media_product_type: "FEED",
      permalink: "https://www.instagram.com/p/regular-feed/",
    }),
  ]);

  assert.deepEqual(
    selected.map((item) => item.id),
    ["permalink-fallback"],
  );
});

test("orders Reels by timestamp before applying the visible limit", () => {
  const selected = selectInstagramReels(
    [
      graphReel("old", { timestamp: "2026-08-19T15:00:00.000Z" }),
      graphReel("new", { timestamp: "2026-08-28T15:00:00.000Z" }),
      graphReel("middle", { timestamp: "2026-08-22T15:00:00.000Z" }),
    ],
    2,
  );

  assert.deepEqual(
    selected.map((item) => item.id),
    ["new", "middle"],
  );
});
