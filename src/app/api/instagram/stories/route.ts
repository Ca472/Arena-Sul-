import { NextResponse } from "next/server";
import { getLiveInstagramFeed } from "@/lib/instagram/live-query";

export const runtime = "nodejs";

export async function GET() {
  const feed = await getLiveInstagramFeed();
  const snapshot = {
    status: feed.storiesStatus,
    stories: feed.stories,
    fetchedAt: feed.storiesStatus === "connected" ? feed.fetchedAt : null,
  };

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control":
        "private, no-store, no-cache, max-age=0, must-revalidate",
      Expires: "0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Instagram-Stories-Fetched-At": snapshot.fetchedAt ?? "unavailable",
    },
  });
}
