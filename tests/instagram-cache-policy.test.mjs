import assert from "node:assert/strict";
import test from "node:test";

import { getInstagramFetchCachePolicy } from "../src/lib/instagram/cache-policy.ts";

test("always fetches active Stories again when the page is reloaded", () => {
  assert.deepEqual(getInstagramFetchCachePolicy("stories"), {
    cache: "no-store",
  });
});

test("keeps Reels cached independently for fifteen minutes", () => {
  assert.deepEqual(getInstagramFetchCachePolicy("media"), {
    cache: "force-cache",
    next: {
      revalidate: 900,
      tags: ["instagram-reels"],
    },
  });
});
