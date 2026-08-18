import "server-only";

import { z } from "zod";
import type {
  InstagramFeed,
  InstagramMediaItem,
  InstagramMediaKind,
} from "./types";

const DEFAULT_GRAPH_VERSION = "v26.0";
const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/arenasulsports/";
const STORY_MAX_AGE_MS = 25 * 60 * 60 * 1000;

const graphMediaSchema = z
  .object({
    id: z.string().min(1),
    caption: z.string().optional(),
    media_type: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
    media_product_type: z.string().optional(),
    media_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    permalink: z.string().url().optional(),
    timestamp: z.string().min(1),
  })
  .passthrough();

const graphResponseSchema = z.object({
  data: z.array(graphMediaSchema),
});

type GraphMedia = z.infer<typeof graphMediaSchema>;

function emptyFeed(status: InstagramFeed["status"]): InstagramFeed {
  return { status, stories: [], reels: [] };
}

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

function safePermalink(value: string | undefined, kind: InstagramMediaKind) {
  if (kind === "story") {
    return "https://www.instagram.com/stories/arenasulsports/";
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

function normalizeMedia(
  media: GraphMedia,
  kind: InstagramMediaKind,
): InstagramMediaItem | null {
  if (media.media_type === "CAROUSEL_ALBUM") {
    return null;
  }

  const mediaUrl = isAllowedMediaUrl(media.media_url)
    ? media.media_url
    : null;

  if (!mediaUrl) {
    return null;
  }

  const timestamp = new Date(media.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  const thumbnailUrl = isAllowedMediaUrl(media.thumbnail_url)
    ? media.thumbnail_url
    : null;

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

async function fetchInstagramEdge({
  edge,
  fields,
  revalidate,
  tag,
  userId,
  accessToken,
  graphVersion,
}: {
  edge: "media" | "stories";
  fields: string;
  revalidate: number;
  tag: string;
  userId: string;
  accessToken: string;
  graphVersion: string;
}) {
  const endpoint = new URL(
    `https://graph.instagram.com/${graphVersion}/${encodeURIComponent(userId)}/${edge}`,
  );
  endpoint.searchParams.set("fields", fields);
  endpoint.searchParams.set("limit", edge === "media" ? "25" : "20");

  const response = await fetch(endpoint, {
    cache: "force-cache",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    next: {
      revalidate,
      tags: [tag],
    },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Instagram API request failed with status ${response.status}`);
  }

  return graphResponseSchema.parse(await response.json()).data;
}

/**
 * Reads the Arena's own Instagram media without exposing the access token to
 * the browser. New stories are visible for their active lifetime; reels are
 * refreshed independently through the Next.js data cache.
 */
export async function getInstagramFeed(): Promise<InstagramFeed> {
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const requestedGraphVersion = process.env.INSTAGRAM_GRAPH_VERSION?.trim();
  const graphVersion =
    requestedGraphVersion && /^v\d+\.\d+$/.test(requestedGraphVersion)
      ? requestedGraphVersion
      : DEFAULT_GRAPH_VERSION;

  if (!userId || !accessToken) {
    return emptyFeed("unconfigured");
  }

  try {
    const [mediaResult, storiesResult] = await Promise.allSettled([
      fetchInstagramEdge({
        edge: "media",
        fields:
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
        revalidate: 900,
        tag: "instagram-reels",
        userId,
        accessToken,
        graphVersion,
      }),
      fetchInstagramEdge({
        edge: "stories",
        fields: "id,media_type,media_url,thumbnail_url,permalink,timestamp",
        revalidate: 300,
        tag: "instagram-stories",
        userId,
        accessToken,
        graphVersion,
      }),
    ]);

    if (
      mediaResult.status === "rejected" &&
      storiesResult.status === "rejected"
    ) {
      return emptyFeed("unavailable");
    }

    const media =
      mediaResult.status === "fulfilled" ? mediaResult.value : [];
    const stories =
      storiesResult.status === "fulfilled" ? storiesResult.value : [];

    const now = Date.now();
    const normalizedStories = stories
      .filter(
        (story) => now - new Date(story.timestamp).getTime() < STORY_MAX_AGE_MS,
      )
      .map((story) => normalizeMedia(story, "story"))
      .filter((story): story is InstagramMediaItem => story !== null)
      .slice(0, 8);

    const normalizedReels = media
      .filter(
        (item) =>
          item.media_product_type === "REELS" ||
          item.permalink?.includes("/reel/"),
      )
      .map((item) => normalizeMedia(item, "reel"))
      .filter((reel): reel is InstagramMediaItem => reel !== null)
      .slice(0, 6);

    return {
      status: "connected",
      stories: normalizedStories,
      reels: normalizedReels,
    };
  } catch {
    return emptyFeed("unavailable");
  }
}
