import type {
  InstagramMediaItem,
  InstagramMediaKind,
} from "./types";

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/arenasulsports/";
const INSTAGRAM_STORIES_URL =
  "https://www.instagram.com/stories/arenasulsports/";

export const INSTAGRAM_STORY_MAX_AGE_MS = 25 * 60 * 60 * 1000;

export type InstagramGraphMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
};

function isAllowedMediaUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      url.protocol === "https:" &&
      (hostname === "cdninstagram.com" ||
        hostname.endsWith(".cdninstagram.com") ||
        hostname === "fbcdn.net" ||
        hostname.endsWith(".fbcdn.net"))
    );
  } catch {
    return false;
  }
}

function safePermalink(
  value: string | undefined,
  kind: InstagramMediaKind,
) {
  if (kind === "story") {
    return INSTAGRAM_STORIES_URL;
  }

  if (!value) {
    return INSTAGRAM_PROFILE_URL;
  }

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    if (
      url.protocol === "https:" &&
      (hostname === "instagram.com" || hostname.endsWith(".instagram.com"))
    ) {
      return url.toString();
    }
  } catch {
    // The public profile is a safe fallback for malformed API data.
  }

  return INSTAGRAM_PROFILE_URL;
}

export function normalizeInstagramMedia(
  media: InstagramGraphMedia,
  kind: InstagramMediaKind,
): InstagramMediaItem | null {
  if (media.media_type === "CAROUSEL_ALBUM") {
    return null;
  }

  const mediaUrl = isAllowedMediaUrl(media.media_url) ? media.media_url : null;
  const thumbnailUrl = isAllowedMediaUrl(media.thumbnail_url)
    ? media.thumbnail_url
    : null;

  // Meta may intentionally omit media_url for Reels that contain protected or
  // licensed audio. Keep the card when a safe thumbnail is still available.
  if (!mediaUrl && !thumbnailUrl) {
    return null;
  }

  const timestamp = new Date(media.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return {
    id: media.id,
    kind,
    mediaType: media.media_type,
    mediaUrl,
    thumbnailUrl,
    permalink: safePermalink(media.permalink, kind),
    caption: media.caption?.replace(/\s+/g, " ").trim().slice(0, 220) || null,
    timestamp: timestamp.toISOString(),
  };
}

export function normalizeInstagramStories(
  stories: InstagramGraphMedia[],
  now = Date.now(),
  limit = 8,
) {
  return stories
    .filter(
      (story) => now - new Date(story.timestamp).getTime() < INSTAGRAM_STORY_MAX_AGE_MS,
    )
    .map((story) => normalizeInstagramMedia(story, "story"))
    .filter((story): story is InstagramMediaItem => story !== null)
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, limit);
}

export function selectInstagramReels(
  media: InstagramGraphMedia[],
  limit = 6,
) {
  return media
    .filter(
      (item) =>
        item.media_product_type?.toUpperCase() === "REELS" ||
        item.permalink?.includes("/reel/"),
    )
    .map((item) => normalizeInstagramMedia(item, "reel"))
    .filter((reel): reel is InstagramMediaItem => reel !== null)
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, limit);
}
