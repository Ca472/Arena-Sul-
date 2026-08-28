import { NextResponse } from "next/server";
import { getLiveInstagramFeed } from "@/lib/instagram/live-query";

export const runtime = "nodejs";

export async function GET() {
  const feed = await getLiveInstagramFeed();

  return NextResponse.json(feed, {
    headers: {
      "Cache-Control":
        "private, no-store, no-cache, max-age=0, must-revalidate",
      Expires: "0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Instagram-Feed-Fetched-At": feed.fetchedAt ?? "unavailable",
    },
  });
}
