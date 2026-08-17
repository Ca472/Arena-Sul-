import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/config/runtime";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";

export type SessionRefreshResult = {
  response: NextResponse;
  userId: string | null;
};

export async function refreshSupabaseSession(
  request: NextRequest,
): Promise<SessionRefreshResult> {
  const config = getPublicSupabaseConfig();
  let response = NextResponse.next({ request });

  if (!config) {
    return { response, userId: null };
  }

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // getUser validates the access token with Supabase Auth; getSession alone
  // must not be used for authorization decisions on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Every administrative response is user-specific. This also protects the
  // uncommon case where a token refresh writes Set-Cookie headers at the edge.
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Expires", "0");
  response.headers.set("Pragma", "no-cache");

  return { response, userId: user?.id ?? null };
}
