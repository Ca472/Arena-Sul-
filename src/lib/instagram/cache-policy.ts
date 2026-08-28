export type InstagramFeedEdge = "media" | "stories";

export function getInstagramFetchCachePolicy(edge: InstagramFeedEdge) {
  if (edge !== "media" && edge !== "stories") {
    throw new Error("Unsupported Instagram feed edge");
  }

  return { cache: "no-store" as const };
}
