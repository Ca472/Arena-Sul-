import "server-only";

import { unstable_cache } from "next/cache";
import { INSTAGRAM_STORIES_SHARED_CACHE_SECONDS } from "./live-sync";
import { getInstagramStoriesSnapshot } from "./queries";

export const getLiveInstagramStoriesSnapshot = unstable_cache(
  async () => getInstagramStoriesSnapshot(),
  ["instagram-stories-live-v1"],
  {
    revalidate: INSTAGRAM_STORIES_SHARED_CACHE_SECONDS,
    tags: ["instagram-stories-live"],
  },
);
