import "server-only";

import { unstable_cache } from "next/cache";
import {
  getInstagramStoriesCacheBucket,
  INSTAGRAM_STORIES_SHARED_CACHE_SECONDS,
} from "./live-sync";
import { getInstagramStoriesSnapshot } from "./queries";

const getCachedInstagramStoriesSnapshot = unstable_cache(
  async (cacheBucket: number) => {
    if (!Number.isSafeInteger(cacheBucket) || cacheBucket < 0) {
      throw new Error("Invalid Instagram Stories cache bucket");
    }

    return getInstagramStoriesSnapshot();
  },
  ["instagram-stories-live-v2"],
  {
    revalidate: INSTAGRAM_STORIES_SHARED_CACHE_SECONDS * 2,
    tags: ["instagram-stories-live"],
  },
);

export function getLiveInstagramStoriesSnapshot(now = Date.now()) {
  return getCachedInstagramStoriesSnapshot(getInstagramStoriesCacheBucket(now));
}
