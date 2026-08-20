export type InstagramFeedEdge = "media" | "stories";

export function getInstagramFetchCachePolicy(edge: InstagramFeedEdge) {
  if (edge === "stories") {
    return { cache: "no-store" as const };
  }

  return {
    cache: "force-cache" as const,
    next: {
      revalidate: 900,
      tags: ["instagram-reels"],
    },
  };
}
