import "server-only";

import { z } from "zod";

import {
  getInstagramOAuthPublicConfig,
  getInstagramOAuthSecretConfig,
} from "@/lib/instagram/config";

export const INSTAGRAM_OAUTH_COOKIE = "__Host-arena_ig_oauth_state";
export const INSTAGRAM_OAUTH_SCOPE = "instagram_business_basic";
export const INVITE_TTL_MS = 24 * 60 * 60 * 1000;
export const STATE_TTL_MS = 20 * 60 * 1000;

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
  id: z.union([z.string(), z.number()]).transform(String),
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
    throw new Error("Instagram OAuth secrets are not configured");
  }

  const body = new FormData();
  body.set("client_id", config.appId);
  body.set("client_secret", config.appSecret);
  body.set("grant_type", "authorization_code");
  body.set("redirect_uri", config.redirectUri);
  body.set("code", code);

  const shortResponse = await fetch(
    "https://api.instagram.com/oauth/access_token",
    {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!shortResponse.ok) {
    throw new Error("Instagram authorization code exchange failed");
  }

  const parsedShort = oauthTokenResponseSchema.parse(await shortResponse.json());
  const shortToken = "data" in parsedShort ? parsedShort.data[0] : parsedShort;
  const scopes = normalizePermissions(shortToken.permissions);

  if (!scopes.includes(INSTAGRAM_OAUTH_SCOPE)) {
    throw new Error("Instagram basic permission was not granted");
  }

  const longEndpoint = new URL("https://graph.instagram.com/access_token");
  longEndpoint.searchParams.set("grant_type", "ig_exchange_token");
  longEndpoint.searchParams.set("client_secret", config.appSecret);
  longEndpoint.searchParams.set("access_token", shortToken.access_token);

  const longResponse = await fetch(longEndpoint, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!longResponse.ok) {
    throw new Error("Instagram long-lived token exchange failed");
  }

  const longToken = longLivedTokenSchema.parse(await longResponse.json());
  const profileEndpoint = new URL(
    `https://graph.instagram.com/${config.graphVersion}/me`,
  );
  profileEndpoint.searchParams.set("fields", "id,user_id,username");

  const profileResponse = await fetch(profileEndpoint, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${longToken.access_token}` },
    signal: AbortSignal.timeout(8000),
  });

  if (!profileResponse.ok) {
    throw new Error("Instagram account verification failed");
  }

  const parsedProfile = profileResponseSchema.parse(
    await profileResponse.json(),
  );
  const profile =
    "data" in parsedProfile ? parsedProfile.data[0] : parsedProfile;
  const username = profile.username.trim().toLowerCase();

  if (
    username !== config.expectedUsername ||
    profile.id !== shortToken.user_id
  ) {
    throw new Error("The authorized Instagram account is not the expected account");
  }

  return {
    userId: profile.user_id,
    username,
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
