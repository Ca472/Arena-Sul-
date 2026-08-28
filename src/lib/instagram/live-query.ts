import "server-only";

import { unstable_cache } from "next/cache";
import {
  getInstagramLiveCacheBucket,
  INSTAGRAM_LIVE_SHARED_CACHE_SECONDS,
} from "./live-sync";
import { getInstagramFeed } from "./queries";

const getCachedInstagramLiveFeed = unstable_cache(
  async (cacheBucket: number) => {
    if (!Number.isSafeInteger(cacheBucket) || cacheBucket < 0) {
      throw new Error("Invalid Instagram live-feed cache bucket");
    }

    return getInstagramFeed();
  },
  ["instagram-live-feed-v1"],
  {
    revalidate: INSTAGRAM_LIVE_SHARED_CACHE_SECONDS * 2,
    tags: ["instagram-live-feed"],
  },
);

export function getLiveInstagramFeed(now = Date.now()) {
  return getCachedInstagramLiveFeed(getInstagramLiveCacheBucket(now));
}
