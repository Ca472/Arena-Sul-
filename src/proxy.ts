import { NextResponse, type NextRequest } from "next/server";

import { getRuntimeMode } from "@/lib/config/runtime";
import { refreshSupabaseSession } from "@/lib/supabase/update-session";

export async function proxy(request: NextRequest) {
  const mode = getRuntimeMode();
  const isLogin = request.nextUrl.pathname === "/admin/login";

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
    loginUrl.searchParams.set("retorno", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
