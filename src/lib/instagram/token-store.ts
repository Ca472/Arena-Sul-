import "server-only";

import { getInstagramOAuthPublicConfig } from "@/lib/instagram/config";
import {
  decryptInstagramToken,
  encryptInstagramToken,
} from "@/lib/instagram/crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type StoredInstagramCredentials = {
  userId: string;
  username: string;
  accessToken: string;
  scopes: string[];
  expiresAt: string;
};

export type InstagramConnectionMetadata = {
  username: string;
  expiresAt: string;
  connectedAt: string;
  updatedAt: string;
  expired: boolean;
};

export async function getInstagramConnectionMetadata(): Promise<
  InstagramConnectionMetadata | null
> {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("instagram_connections")
    .select("username, expires_at, connected_at, updated_at")
    .eq("id", "arena-sul")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const expiry = new Date(data.expires_at).getTime();
  return {
    username: data.username,
    expiresAt: data.expires_at,
    connectedAt: data.connected_at,
    updatedAt: data.updated_at,
    expired: !Number.isFinite(expiry) || expiry <= Date.now(),
  };
}

export async function getStoredInstagramCredentials(): Promise<
  StoredInstagramCredentials | null
> {
  const oauthConfig = getInstagramOAuthPublicConfig();
  const supabase = createSupabaseServiceRoleClient();

  if (!oauthConfig || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("instagram_connections")
    .select(
      "instagram_user_id, username, token_ciphertext, token_iv, token_auth_tag, token_key_version, scopes, expires_at",
    )
    .eq("id", "arena-sul")
    .maybeSingle();

  if (error || !data || data.token_key_version !== 1) {
    return null;
  }

  const expiry = new Date(data.expires_at).getTime();
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    return null;
  }

  let accessToken: string;
  try {
    accessToken = decryptInstagramToken({
      encrypted: {
        ciphertext: data.token_ciphertext,
        iv: data.token_iv,
        authTag: data.token_auth_tag,
      },
      appId: oauthConfig.appId,
      userId: data.instagram_user_id,
    });
  } catch {
    return null;
  }

  return {
    userId: data.instagram_user_id,
    username: data.username,
    accessToken,
    scopes: data.scopes,
    expiresAt: data.expires_at,
  };
}

export async function saveInstagramConnection({
  userId,
  username,
  accessToken,
  scopes,
  expiresAt,
}: StoredInstagramCredentials) {
  const oauthConfig = getInstagramOAuthPublicConfig();
  const supabase = createSupabaseServiceRoleClient();

  if (!oauthConfig || !supabase) {
    throw new Error("Instagram persistence is not configured");
  }

  const encrypted = encryptInstagramToken({
    token: accessToken,
    appId: oauthConfig.appId,
    userId,
  });
  const now = new Date().toISOString();

  const { error } = await supabase.from("instagram_connections").upsert(
    {
      id: "arena-sul",
      instagram_user_id: userId,
      username,
      token_ciphertext: encrypted.ciphertext,
      token_iv: encrypted.iv,
      token_auth_tag: encrypted.authTag,
      token_key_version: 1,
      scopes,
      expires_at: expiresAt,
      last_refreshed_at: now,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error("Instagram connection could not be stored");
  }
}
