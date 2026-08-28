import type {
  InstagramFeed,
  InstagramMediaItem,
  InstagramMediaKind,
} from "./types";

export const INSTAGRAM_LIVE_REFRESH_MS = 15_000;
export const INSTAGRAM_LIVE_MIN_REFRESH_MS = 5_000;
export const INSTAGRAM_LIVE_SHARED_CACHE_SECONDS = 15;

export function getInstagramLiveCacheBucket(now: number) {
  const bucketSizeMs = INSTAGRAM_LIVE_SHARED_CACHE_SECONDS * 1000;
  return Math.floor(Math.max(0, now) / bucketSizeMs);
}

export function getInstagramLiveRefreshDelay(
  lastRefreshStartedAt: number,
  now: number,
) {
  if (lastRefreshStartedAt <= 0 || now <= lastRefreshStartedAt) {
    return lastRefreshStartedAt <= 0 ? 0 : INSTAGRAM_LIVE_REFRESH_MS;
  }

  return Math.max(0, INSTAGRAM_LIVE_REFRESH_MS - (now - lastRefreshStartedAt));
}

export function getInstagramLiveSnapshotTimestamp(fetchedAt: string | null) {
  if (!fetchedAt) {
    return 0;
  }

  const timestamp = Date.parse(fetchedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

const INSTAGRAM_MEDIA_ITEM_KEYS = new Set([
  "id",
  "kind",
  "mediaType",
  "mediaUrl",
  "thumbnailUrl",
  "permalink",
  "caption",
  "timestamp",
]);

function isInstagramMediaItem(
  value: unknown,
  expectedKind: InstagramMediaKind,
): value is InstagramMediaItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    Object.keys(item).every((key) => INSTAGRAM_MEDIA_ITEM_KEYS.has(key)) &&
    typeof item.id === "string" &&
    item.kind === expectedKind &&
    (item.mediaType === "IMAGE" || item.mediaType === "VIDEO") &&
    (item.mediaUrl === null || typeof item.mediaUrl === "string") &&
    (typeof item.mediaUrl === "string" || typeof item.thumbnailUrl === "string") &&
    (item.thumbnailUrl === null || typeof item.thumbnailUrl === "string") &&
    typeof item.permalink === "string" &&
    (item.caption === null || typeof item.caption === "string") &&
    typeof item.timestamp === "string"
  );
}

export function isInstagramLiveFeedSnapshot(value: unknown): value is InstagramFeed {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  const validStatus =
    snapshot.status === "connected" ||
    snapshot.status === "unconfigured" ||
    snapshot.status === "unavailable";
  const validStoriesStatus =
    snapshot.storiesStatus === "connected" ||
    snapshot.storiesStatus === "unconfigured" ||
    snapshot.storiesStatus === "unavailable";
  const validReelsStatus =
    snapshot.reelsStatus === "connected" ||
    snapshot.reelsStatus === "unconfigured" ||
    snapshot.reelsStatus === "unavailable";
  const hasConnectedEdge =
    snapshot.storiesStatus === "connected" ||
    snapshot.reelsStatus === "connected";
  const statusesAreConsistent =
    (snapshot.status === "connected" &&
      hasConnectedEdge &&
      (snapshot.storiesStatus === "connected" ||
        snapshot.storiesStatus === "unavailable") &&
      (snapshot.reelsStatus === "connected" ||
        snapshot.reelsStatus === "unavailable")) ||
    (snapshot.status === "unconfigured" &&
      snapshot.storiesStatus === "unconfigured" &&
      snapshot.reelsStatus === "unconfigured") ||
    (snapshot.status === "unavailable" &&
      snapshot.storiesStatus === "unavailable" &&
      snapshot.reelsStatus === "unavailable");
  const validFetchedAt =
    snapshot.status === "connected"
      ? typeof snapshot.fetchedAt === "string" &&
        getInstagramLiveSnapshotTimestamp(snapshot.fetchedAt) > 0
      : snapshot.fetchedAt === null;

  return (
    Object.keys(snapshot).every(
      (key) =>
        key === "status" ||
        key === "storiesStatus" ||
        key === "reelsStatus" ||
        key === "stories" ||
        key === "reels" ||
        key === "fetchedAt",
    ) &&
    validStatus &&
    validStoriesStatus &&
    validReelsStatus &&
    statusesAreConsistent &&
    Array.isArray(snapshot.stories) &&
    snapshot.stories.every((item) => isInstagramMediaItem(item, "story")) &&
    Array.isArray(snapshot.reels) &&
    snapshot.reels.every((item) => isInstagramMediaItem(item, "reel")) &&
    validFetchedAt
  );
}

export function mergeInstagramFeedMedia(
  current: Pick<InstagramFeed, "stories" | "reels">,
  snapshot: InstagramFeed,
) {
  return {
    stories:
      snapshot.storiesStatus === "connected"
        ? snapshot.stories
        : current.stories,
    reels:
      snapshot.reelsStatus === "connected" ? snapshot.reels : current.reels,
  };
}

export function areInstagramMediaItemsEqual(
  current: InstagramMediaItem[],
  next: InstagramMediaItem[],
) {
  return (
    current.length === next.length &&
    current.every((story, index) => {
      const nextStory = next[index];
      return (
        nextStory !== undefined &&
        story.id === nextStory.id &&
        story.kind === nextStory.kind &&
        story.mediaType === nextStory.mediaType &&
        story.mediaUrl === nextStory.mediaUrl &&
        story.thumbnailUrl === nextStory.thumbnailUrl &&
        story.permalink === nextStory.permalink &&
        story.caption === nextStory.caption &&
        story.timestamp === nextStory.timestamp
      );
    })
  );
}

export function findStoryIndexAfterRefresh(
  activeStoryId: string | null,
  stories: InstagramMediaItem[],
) {
  if (!activeStoryId || stories.length === 0) {
    return 0;
  }

  const preservedIndex = stories.findIndex(
    (story) => story.id === activeStoryId,
  );
  return preservedIndex >= 0 ? preservedIndex : 0;
}

export function getAdjacentStoryIndex(
  activeStoryId: string | null,
  stories: InstagramMediaItem[],
  direction: "previous" | "next",
) {
  if (stories.length === 0) {
    return 0;
  }

  const currentIndex = findStoryIndexAfterRefresh(activeStoryId, stories);
  const offset = direction === "previous" ? -1 : 1;
  return (currentIndex + offset + stories.length) % stories.length;
}

export function getStorySwipeDirection(distanceX: number, distanceY: number) {
  if (Math.abs(distanceX) < 48 || Math.abs(distanceX) <= Math.abs(distanceY) * 1.2) {
    return null;
  }

  return distanceX < 0 ? ("next" as const) : ("previous" as const);
}
