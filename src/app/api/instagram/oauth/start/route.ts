import { NextResponse, type NextRequest } from "next/server";

import { getInstagramPortalOrigin } from "@/lib/instagram/config";
import {
  applyInstagramSecurityHeaders,
  buildInstagramAuthorizationUrl,
  INSTAGRAM_OAUTH_COOKIE,
  STATE_TTL_MS,
} from "@/lib/instagram/oauth";
import { consumeInviteAndCreateState } from "@/lib/instagram/oauth-store";

export const runtime = "nodejs";

function cleanRedirect(path: string) {
  const origin = getInstagramPortalOrigin();
  const response = NextResponse.redirect(
    new URL(path, origin ?? "https://arena-sul-portal.vercel.app"),
    303,
  );
  applyInstagramSecurityHeaders(response.headers);
  return response;
}

export async function POST(request: NextRequest) {
  const portalOrigin = getInstagramPortalOrigin();
  const requestOrigin = request.headers.get("origin");

  if (!portalOrigin || requestOrigin !== portalOrigin) {
    return cleanRedirect("/integracoes/instagram/resultado?status=configuracao");
  }

  const formData = await request.formData().catch(() => null);
  const inviteToken = formData?.get("convite");

  if (typeof inviteToken !== "string") {
    return cleanRedirect("/integracoes/instagram/resultado?status=convite");
  }

  const attempt = await consumeInviteAndCreateState(inviteToken);
  if (!attempt) {
    return cleanRedirect("/integracoes/instagram/resultado?status=convite");
  }

  const response = NextResponse.redirect(
    buildInstagramAuthorizationUrl(attempt.state),
    303,
  );
  response.cookies.set(INSTAGRAM_OAUTH_COOKIE, attempt.state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(STATE_TTL_MS / 1000),
  });
  applyInstagramSecurityHeaders(response.headers);
  return response;
}
