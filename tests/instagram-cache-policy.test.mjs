import assert from "node:assert/strict";
import test from "node:test";

import { getInstagramFetchCachePolicy } from "../src/lib/instagram/cache-policy.ts";

test("always fetches active Stories from Meta for each shared live window", () => {
  assert.deepEqual(getInstagramFetchCachePolicy("stories"), {
    cache: "no-store",
  });
});

test("always fetches Reels from Meta for each shared live window", () => {
  assert.deepEqual(getInstagramFetchCachePolicy("media"), {
    cache: "no-store",
  });
});
