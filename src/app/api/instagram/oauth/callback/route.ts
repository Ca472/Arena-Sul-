import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getInstagramPortalOrigin } from "@/lib/instagram/config";
import { secretsMatch } from "@/lib/instagram/crypto";
import {
  applyInstagramSecurityHeaders,
  exchangeInstagramAuthorizationCode,
  INSTAGRAM_OAUTH_COOKIE,
} from "@/lib/instagram/oauth";
import {
  consumeInstagramOAuthState,
  isValidOAuthSecret,
} from "@/lib/instagram/oauth-store";
import { saveInstagramConnection } from "@/lib/instagram/token-store";

export const runtime = "nodejs";

function resultResponse(request: NextRequest, status: string) {
  const origin = getInstagramPortalOrigin();
  const url = new URL(
    "/integracoes/instagram/resultado",
    origin ?? request.nextUrl.origin,
  );
  url.searchParams.set("status", status);

  const response = NextResponse.redirect(url, 303);
  response.cookies.set(INSTAGRAM_OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  applyInstagramSecurityHeaders(response.headers);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get(INSTAGRAM_OAUTH_COOKIE)?.value;

  if (
    !isValidOAuthSecret(state) ||
    !isValidOAuthSecret(cookieState) ||
    !secretsMatch(state, cookieState)
  ) {
    return resultResponse(request, "seguranca");
  }

  const stateConsumed = await consumeInstagramOAuthState(state);
  if (!stateConsumed) {
    return resultResponse(request, "seguranca");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return resultResponse(request, "cancelado");
  }

  if (!code || code.length > 4096) {
    return resultResponse(request, "falha");
  }

  try {
    const authorization = await exchangeInstagramAuthorizationCode(code);
    await saveInstagramConnection(authorization);
    revalidatePath("/");
    return resultResponse(request, "conectado");
  } catch {
    return resultResponse(request, "falha");
  }
}
