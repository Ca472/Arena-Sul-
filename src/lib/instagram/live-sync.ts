import type { InstagramMediaItem, InstagramStoriesSnapshot } from "./types";

export const INSTAGRAM_STORIES_REFRESH_MS = 30_000;
export const INSTAGRAM_STORIES_MIN_REFRESH_MS = 30_000;
export const INSTAGRAM_STORIES_SHARED_CACHE_SECONDS = 25;

export function getInstagramStoriesRefreshDelay(
  lastRefreshStartedAt: number,
  now: number,
) {
  if (lastRefreshStartedAt <= 0 || now <= lastRefreshStartedAt) {
    return lastRefreshStartedAt <= 0 ? 0 : INSTAGRAM_STORIES_REFRESH_MS;
  }

  return Math.max(
    0,
    INSTAGRAM_STORIES_REFRESH_MS - (now - lastRefreshStartedAt),
  );
}

export function getInstagramStoriesSnapshotTimestamp(fetchedAt: string | null) {
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

function isInstagramMediaItem(value: unknown): value is InstagramMediaItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    Object.keys(item).every((key) => INSTAGRAM_MEDIA_ITEM_KEYS.has(key)) &&
    typeof item.id === "string" &&
    item.kind === "story" &&
    (item.mediaType === "IMAGE" || item.mediaType === "VIDEO") &&
    typeof item.mediaUrl === "string" &&
    (item.thumbnailUrl === null || typeof item.thumbnailUrl === "string") &&
    typeof item.permalink === "string" &&
    (item.caption === null || typeof item.caption === "string") &&
    typeof item.timestamp === "string"
  );
}

export function isInstagramStoriesSnapshot(
  value: unknown,
): value is InstagramStoriesSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return (
    Object.keys(snapshot).every(
      (key) => key === "status" || key === "stories" || key === "fetchedAt",
    ) &&
    (snapshot.status === "connected" ||
      snapshot.status === "unconfigured" ||
      snapshot.status === "unavailable") &&
    Array.isArray(snapshot.stories) &&
    snapshot.stories.every(isInstagramMediaItem) &&
    (snapshot.fetchedAt === null ||
      (typeof snapshot.fetchedAt === "string" &&
        getInstagramStoriesSnapshotTimestamp(snapshot.fetchedAt) > 0))
  );
}

export function areInstagramStoriesEqual(
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
        story.mediaUrl === nextStory.mediaUrl &&
        story.thumbnailUrl === nextStory.thumbnailUrl &&
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
