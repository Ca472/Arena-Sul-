import "server-only";

import { z } from "zod";

import {
  validateInstagramAccountIdentity,
} from "@/lib/instagram/account-validation";
import {
  getInstagramOAuthPublicConfig,
  getInstagramOAuthSecretConfig,
} from "@/lib/instagram/config";

export const INSTAGRAM_OAUTH_COOKIE = "__Host-arena_ig_oauth_state";
export const INSTAGRAM_OAUTH_SCOPE = "instagram_business_basic";
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
export const STATE_TTL_MS = 20 * 60 * 1000;

export type InstagramOAuthStage =
  | "configuration"
  | "short_token_request"
  | "short_token_response"
  | "permission_validation"
  | "long_token_request"
  | "long_token_response"
  | "profile_request"
  | "profile_response"
  | "username_validation";

export class InstagramOAuthError extends Error {
  readonly stage: InstagramOAuthStage;
  readonly upstreamStatus?: number;

  constructor(stage: InstagramOAuthStage, upstreamStatus?: number) {
    super(`Instagram OAuth failed at ${stage}`);
    this.name = "InstagramOAuthError";
    this.stage = stage;
    this.upstreamStatus = upstreamStatus;
  }
}

const oauthTokenItemSchema = z.object({
  access_token: z.string().min(20),
  user_id: z.union([z.string(), z.number()]).transform(String),
  permissions: z
    .union([z.string(), z.array(z.string())])
    .optional(),
});

const oauthTokenResponseSchema = z.union([
  oauthTokenItemSchema,
  z.object({ data: z.array(oauthTokenItemSchema).min(1) }),
]);

const longLivedTokenSchema = z.object({
  access_token: z.string().min(20),
  token_type: z.string().optional(),
  expires_in: z.number().int().positive(),
});

const profileItemSchema = z.object({
  user_id: z.union([z.string(), z.number()]).transform(String),
  username: z.string().min(1),
});

const profileResponseSchema = z.union([
  profileItemSchema,
  z.object({ data: z.array(profileItemSchema).min(1) }),
]);

export type InstagramAuthorization = {
  userId: string;
  username: string;
  accessToken: string;
  scopes: string[];
  expiresAt: string;
};

function normalizePermissions(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  const permissions = Array.isArray(value) ? value : value.split(/[\s,]+/);
  return [...new Set(permissions.map((item) => item.trim()).filter(Boolean))];
}

export function buildInstagramAuthorizationUrl(state: string) {
  const config = getInstagramOAuthPublicConfig();
  if (!config) {
    throw new Error("Instagram OAuth is not configured");
  }

  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", config.appId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", INSTAGRAM_OAUTH_SCOPE);
  url.searchParams.set("state", state);
  url.searchParams.set("enable_fb_login", "false");
  url.searchParams.set("force_reauth", "true");
  return url;
}

export async function exchangeInstagramAuthorizationCode(
  code: string,
): Promise<InstagramAuthorization> {
  const config = getInstagramOAuthSecretConfig();
  if (!config) {
    throw new InstagramOAuthError("configuration");
  }

  const body = new FormData();
  body.set("client_id", config.appId);
  body.set("client_secret", config.appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", code);

  let shortResponse: Response;
  try {
    shortResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
  } catch {
    throw new InstagramOAuthError("short_token_request");
  }

  if (!shortResponse.ok) {
    throw new InstagramOAuthError(
      "short_token_request",
      shortResponse.status,
    );
  }

  let parsedShort: z.infer<typeof oauthTokenResponseSchema>;
  try {
    parsedShort = oauthTokenResponseSchema.parse(await shortResponse.json());
  } catch {
    throw new InstagramOAuthError("short_token_response");
  }
  const shortToken = "data" in parsedShort ? parsedShort.data[0] : parsedShort;
  const scopes = normalizePermissions(shortToken.permissions);

  if (!scopes.includes(INSTAGRAM_OAUTH_SCOPE)) {
    throw new InstagramOAuthError("permission_validation");
  }

  const longEndpoint = new URL("https://graph.instagram.com/access_token");
  longEndpoint.searchParams.set("grant_type", "ig_exchange_token");
  longEndpoint.searchParams.set("client_secret", config.appSecret);
  longEndpoint.searchParams.set("access_token", shortToken.access_token);

  let longResponse: Response;
  try {
    longResponse = await fetch(longEndpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new InstagramOAuthError("long_token_request");
  }

  if (!longResponse.ok) {
    throw new InstagramOAuthError("long_token_request", longResponse.status);
  }

  let longToken: z.infer<typeof longLivedTokenSchema>;
  try {
    longToken = longLivedTokenSchema.parse(await longResponse.json());
  } catch {
    throw new InstagramOAuthError("long_token_response");
  }
  const profileEndpoint = new URL(
    `https://graph.instagram.com/${config.graphVersion}/me`,
  );
  profileEndpoint.searchParams.set("fields", "user_id,username");

  let profileResponse: Response;
  try {
    profileResponse = await fetch(profileEndpoint, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${longToken.access_token}` },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new InstagramOAuthError("profile_request");
  }

  if (!profileResponse.ok) {
    throw new InstagramOAuthError("profile_request", profileResponse.status);
  }

  let parsedProfile: z.infer<typeof profileResponseSchema>;
  try {
    parsedProfile = profileResponseSchema.parse(await profileResponse.json());
  } catch {
    throw new InstagramOAuthError("profile_response");
  }
  const profile =
    "data" in parsedProfile ? parsedProfile.data[0] : parsedProfile;
  const account = validateInstagramAccountIdentity(
    profile,
    config.expectedUsername,
  );

  if (!account) {
    throw new InstagramOAuthError("username_validation");
  }

  return {
    userId: account.userId,
    username: account.username,
    accessToken: longToken.access_token,
    scopes,
    expiresAt: new Date(Date.now() + longToken.expires_in * 1000).toISOString(),
  };
}

export function applyInstagramSecurityHeaders(headers: Headers) {
  headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  headers.set("Expires", "0");
  headers.set("Pragma", "no-cache");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  headers.set("X-Content-Type-Options", "nosniff");
}
