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
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

function loginErrorUrl(request: NextRequest, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("erro", error);
  return url;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const flowId = request.nextUrl.searchParams.get("sb_flow_id");
  const mode = getRuntimeMode();
  const config = getPublicSupabaseConfig();

  if (mode === "demo") {
    return redirectWithoutCaching(new URL("/admin/login", request.url));
  }

  if (mode !== "supabase" || !config) {
    return redirectWithoutCaching(loginErrorUrl(request, "configuracao"));
  }

  // This callback accepts only the short-lived PKCE authorization code. It
  // intentionally has no user-controlled return path or implicit token flow.
  if (!code || code.length > 4096) {
    return redirectWithoutCaching(loginErrorUrl(request, "recuperacao"));
  }

  // Newer auth-js clients can append a flow-specific PKCE identifier. Keep it
  // optional for compatibility with the current client default, but reject a
  // malformed value before it can influence verifier lookup.
  if (flowId && !/^[A-Za-z0-9_-]{8,64}$/.test(flowId)) {
    return redirectWithoutCaching(loginErrorUrl(request, "recuperacao"));
  }

  const response = redirectWithoutCaching(
    new URL(PASSWORD_SETUP_PATH, request.url),
  );
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

  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(
      code,
      flowId ? { flowId } : undefined,
    );

  if (exchangeError) {
    response.headers.set(
      "Location",
      loginErrorUrl(request, "recuperacao").toString(),
    );
    return response;
  }

  // The verifier created by resetPasswordForEmail carries the recovery type.
  // Reject any other valid PKCE flow so a login/OAuth code cannot be confused
  // with proof that the user requested a password reset.
  // auth-js returns redirectType at runtime (and documents it in the method
  // example), although AuthTokenResponse does not expose that field yet.
  const redirectType = (
    exchangeData as typeof exchangeData & { redirectType?: unknown }
  ).redirectType;

  if (redirectType !== "recovery") {
    await supabase.auth.signOut({ scope: "local" });
    response.headers.set(
      "Location",
      loginErrorUrl(request, "recuperacao").toString(),
    );
    return response;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut({ scope: "local" });
    response.headers.set(
      "Location",
      loginErrorUrl(request, "recuperacao").toString(),
    );
    return response;
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    await supabase.auth.signOut({ scope: "local" });
    response.headers.set("Location", loginErrorUrl(request, "acesso").toString());
  }

  return response;
}
