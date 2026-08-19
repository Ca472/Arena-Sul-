import "server-only";

import {
  hashOAuthSecret,
  randomOAuthSecret,
} from "@/lib/instagram/crypto";
import {
  INVITE_TTL_MS,
  STATE_TTL_MS,
} from "@/lib/instagram/oauth";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type InstagramInvite = {
  token: string;
  expiresAt: string;
};

export function isValidOAuthSecret(
  value: string | null | undefined,
): value is string {
  return Boolean(value && SECRET_PATTERN.test(value));
}

export async function createInstagramInvite(
  createdBy: string,
): Promise<InstagramInvite> {
  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Instagram persistence is not configured");
  }

  const token = randomOAuthSecret();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
  const { data: inviteId, error } = await supabase.rpc(
    "create_instagram_oauth_invite",
    {
      p_token_hash: hashOAuthSecret(token),
      p_expires_at: expiresAt,
      p_created_by: createdBy,
    },
  );

  if (error || !inviteId) {
    throw new Error("Instagram invitation could not be created");
  }

  return { token, expiresAt };
}

export async function isInstagramInviteAvailable(token: string) {
  if (!isValidOAuthSecret(token)) {
    return false;
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("instagram_oauth_invites")
    .select("id")
    .eq("token_hash", hashOAuthSecret(token))
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return !error && Boolean(data);
}

export async function consumeInviteAndCreateState(inviteToken: string) {
  if (!isValidOAuthSecret(inviteToken)) {
    return null;
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return null;
  }

  const state = randomOAuthSecret();
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();
  const { data: consumedInviteId, error: stateError } = await supabase.rpc(
    "consume_instagram_oauth_invite",
    {
      p_invite_hash: hashOAuthSecret(inviteToken),
      p_state_hash: hashOAuthSecret(state),
      p_state_expires_at: expiresAt,
    },
  );

  return stateError || !consumedInviteId ? null : { state, expiresAt };
}

export async function consumeInstagramOAuthState(state: string) {
  if (!isValidOAuthSecret(state)) {
    return false;
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return false;
  }

  const consumedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("instagram_oauth_states")
    .update({ consumed_at: consumedAt })
    .eq("state_hash", hashOAuthSecret(state))
    .is("consumed_at", null)
    .gt("expires_at", consumedAt)
    .select("id")
    .maybeSingle();

  return !error && Boolean(data);
}
