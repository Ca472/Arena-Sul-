import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  getPublicSupabaseConfig,
  getRuntimeMode,
} from "@/lib/config/runtime";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";

const PASSWORD_SETUP_PATH = "/admin/definir-senha";

function redirectWithoutCaching(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

function loginErrorUrl(request: NextRequest, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("erro", error);
  return url;
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const mode = getRuntimeMode();
  const config = getPublicSupabaseConfig();

  // Never consume a one-time invitation while the deployment is intentionally
  // running as a non-persistent demonstration.
  if (mode === "demo") {
    return redirectWithoutCaching(new URL("/admin/login", request.url));
  }

  if (mode !== "supabase" || !config) {
    return redirectWithoutCaching(loginErrorUrl(request, "configuracao"));
  }

  // This endpoint is intentionally single-purpose. It does not accept an
  // arbitrary `next` URL, preventing an invitation link from becoming an
  // open redirect.
  if (!tokenHash || tokenHash.length > 4096 || type !== "invite") {
    return redirectWithoutCaching(loginErrorUrl(request, "convite"));
  }

  const destination = new URL(PASSWORD_SETUP_PATH, request.url);
  const response = redirectWithoutCaching(destination);

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "invite",
  });

  if (error) {
    // Reuse the response so any cookie cleanup emitted by the auth client is
    // retained, while removing the one-time token from the browser URL.
    response.headers.set(
      "Location",
      loginErrorUrl(request, "convite").toString(),
    );
  }

  return response;
}
