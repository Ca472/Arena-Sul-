import { NextResponse } from "next/server";

import { getAdminIdentity } from "@/lib/auth/admin";
import { BLOG_IMAGE_BUCKET } from "@/lib/blog/validation";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const postIdPattern = new RegExp(`^${uuid}$`);
const filenamePattern = new RegExp(`^${uuid}\\.(jpg|png|webp)$`);
const headers = {
  "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

function unavailable(status = 404) {
  return new NextResponse(null, { status, headers: { ...headers, "X-Robots-Tag": "noindex, nofollow" } });
}

/** Stable image URLs never expose a staged/draft file to anonymous readers. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string; filename: string }> },
) {
  const { postId, filename } = await params;
  if (!postIdPattern.test(postId) || !filenamePattern.test(filename)) return unavailable();
  if (getRuntimeMode() !== "supabase") return unavailable();

  const admin = await getAdminIdentity();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return unavailable();
  const storagePath = `${postId}/${filename}`;

  if (!admin || admin.isDemo) {
    // RLS remains the final boundary. Even an authenticated non-admin must have
    // a published article linking this exact immutable object before signing.
    const { data: post, error } = await supabase.from("blog_posts").select("id")
      .eq("id", postId).eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .contains("inline_image_paths", [storagePath]).maybeSingle();
    if (error) {
      console.error(JSON.stringify({ event: "blog_inline_image_lookup_failed", code: error.code }));
      return unavailable(503);
    }
    if (!post) return unavailable();
  }

  // Admins may preview their staged upload before the first draft is saved.
  // Storage policies independently restrict anonymous signing to live images.
  const { data, error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) return unavailable();
  const response = NextResponse.redirect(data.signedUrl, 307);
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  if (admin && !admin.isDemo) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
