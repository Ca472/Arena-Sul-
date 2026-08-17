import { NextResponse, type NextRequest } from "next/server";

import { getRuntimeMode } from "@/lib/config/runtime";
import { refreshSupabaseSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  const mode = getRuntimeMode();
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const isPasswordSetup = request.nextUrl.pathname === "/admin/definir-senha";

  if (mode === "demo") {
    return NextResponse.next();
  }

  if (mode === "misconfigured") {
    if (!isLogin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("erro", "configuracao");
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  const { response, userId } = await refreshSupabaseSession(request);

  if (!userId && !isLogin) {
    const loginUrl = new URL("/admin/login", request.url);
    if (isPasswordSetup) {
      loginUrl.searchParams.set("erro", "sessao");
    } else {
      loginUrl.searchParams.set("retorno", request.nextUrl.pathname);
    }
    const redirectResponse = NextResponse.redirect(loginUrl);

    // Preserve cookie rotation/removal from the Supabase response. Dropping
    // these Set-Cookie values can otherwise cause refresh loops or leave an
    // invalid session in the browser.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    ["cache-control", "expires", "pragma"].forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        redirectResponse.headers.set(header, value);
      }
    });

    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
