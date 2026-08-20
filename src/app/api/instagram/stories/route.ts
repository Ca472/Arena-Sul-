import { NextResponse } from "next/server";
import { getLiveInstagramStoriesSnapshot } from "@/lib/instagram/live-query";

export const runtime = "nodejs";

export async function GET() {
  const snapshot = await getLiveInstagramStoriesSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control":
        "private, no-store, no-cache, max-age=0, must-revalidate",
      Expires: "0",
      Pragma: "no-cache",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
