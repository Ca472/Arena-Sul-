import "server-only";

import { z } from "zod";
import {
  getInstagramFetchCachePolicy,
  type InstagramFeedEdge,
} from "./cache-policy";
import {
  normalizeInstagramStories,
  selectInstagramReels,
} from "./media-normalization";
import type {
  InstagramFeed,
  InstagramStoriesSnapshot,
} from "./types";
import { getStoredInstagramCredentials } from "./token-store";

const DEFAULT_GRAPH_VERSION = "v26.0";

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

const graphErrorResponseSchema = z
  .object({
    error: z
      .object({
        message: z.string().optional(),
        type: z.string().optional(),
        code: z.number().optional(),
        error_subcode: z.number().optional(),
      })
      .passthrough(),
  })
  .passthrough();

type GraphMedia = z.infer<typeof graphMediaSchema>;

function sanitizeGraphErrorMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  return message
    .replace(/(access[_-]?token|bearer)\s*[=:]?\s*[^\s,;]+/gi, "$1 [redacted]")
    .slice(0, 320);
}

function logInstagramGraphFailure(
  event: "instagram_graph_request_failed" | "instagram_graph_transport_failed",
  details: Record<string, unknown>,
) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      ...details,
    }),
  );
}

function emptyFeed(status: InstagramFeed["status"]): InstagramFeed {
  return {
    status,
    storiesStatus: status,
    reelsStatus: status,
    stories: [],
    reels: [],
    fetchedAt: null,
  };
}

function emptyStoriesSnapshot(
  status: InstagramStoriesSnapshot["status"],
): InstagramStoriesSnapshot {
  return { status, stories: [], fetchedAt: null };
}

async function fetchInstagramEdge({
  edge,
  fields,
  userId,
  accessToken,
  graphVersion,
}: {
  edge: InstagramFeedEdge;
  fields: string;
  userId: string;
  accessToken: string;
  graphVersion: string;
}) {
  const endpoint = new URL(
    `https://graph.instagram.com/${graphVersion}/${encodeURIComponent(userId)}/${edge}`,
  );
  endpoint.searchParams.set("fields", fields);
  endpoint.searchParams.set("limit", edge === "media" ? "25" : "20");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      ...getInstagramFetchCachePolicy(edge),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(6500),
    });
  } catch (error) {
    logInstagramGraphFailure("instagram_graph_transport_failed", {
      edge,
      graphVersion,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  }

  if (!response.ok) {
    const graphErrorResult = graphErrorResponseSchema.safeParse(
      await response.json().catch(() => null),
    );
    const graphError = graphErrorResult.success
      ? graphErrorResult.data.error
      : null;

    logInstagramGraphFailure("instagram_graph_request_failed", {
      edge,
      graphVersion,
      status: response.status,
      errorType: graphError?.type,
      errorCode: graphError?.code,
      errorSubcode: graphError?.error_subcode,
      errorMessage: sanitizeGraphErrorMessage(graphError?.message),
    });

    throw new Error(
      `Instagram API request failed with status ${response.status}`,
    );
  }

  return graphResponseSchema.parse(await response.json()).data;
}

function getInstagramGraphVersion() {
  const requestedGraphVersion = process.env.INSTAGRAM_GRAPH_VERSION?.trim();
  return requestedGraphVersion && /^v\d+\.\d+$/.test(requestedGraphVersion)
    ? requestedGraphVersion
    : DEFAULT_GRAPH_VERSION;
}

function normalizeStories(stories: GraphMedia[]) {
  return normalizeInstagramStories(stories);
}

export async function getInstagramStoriesSnapshot(): Promise<InstagramStoriesSnapshot> {
  const storedCredentials = await getStoredInstagramCredentials();
  const userId = storedCredentials?.userId;
  const accessToken = storedCredentials?.accessToken;

  if (!userId || !accessToken) {
    return emptyStoriesSnapshot("unconfigured");
  }

  try {
    const stories = await fetchInstagramEdge({
      edge: "stories",
      fields: "id,media_type,media_url,thumbnail_url,permalink,timestamp",
      userId,
      accessToken,
      graphVersion: getInstagramGraphVersion(),
    });

    return {
      status: "connected",
      stories: normalizeStories(stories),
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return emptyStoriesSnapshot("unavailable");
  }
}

/**
 * Reads the Arena's own Instagram media without exposing the access token to
 * the browser. Stories and Reels are refreshed together by the shared live
 * cache so every visitor sees a recent snapshot without calling Meta once per
 * page view.
 */
export async function getInstagramFeed(): Promise<InstagramFeed> {
  const storedCredentials = await getStoredInstagramCredentials();
  const userId = storedCredentials?.userId;
  const accessToken = storedCredentials?.accessToken;
  const graphVersion = getInstagramGraphVersion();

  if (!userId || !accessToken) {
    return emptyFeed("unconfigured");
  }

  try {
    const [mediaResult, storiesResult] = await Promise.allSettled([
      fetchInstagramEdge({
        edge: "media",
        fields:
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp",
        userId,
        accessToken,
        graphVersion,
      }),
      fetchInstagramEdge({
        edge: "stories",
        fields: "id,media_type,media_url,thumbnail_url,permalink,timestamp",
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

    const media = mediaResult.status === "fulfilled" ? mediaResult.value : [];
    const stories =
      storiesResult.status === "fulfilled" ? storiesResult.value : [];

    const normalizedStories = normalizeStories(stories);

    const normalizedReels = selectInstagramReels(media);

    return {
      status: "connected",
      storiesStatus:
        storiesResult.status === "fulfilled" ? "connected" : "unavailable",
      reelsStatus:
        mediaResult.status === "fulfilled" ? "connected" : "unavailable",
      stories: normalizedStories,
      reels: normalizedReels,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return emptyFeed("unavailable");
  }
}
