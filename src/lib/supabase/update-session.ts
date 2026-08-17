import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseConfig } from "@/lib/config/runtime";
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
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser validates the access token with Supabase Auth; getSession alone
  // must not be used for authorization decisions on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
}
