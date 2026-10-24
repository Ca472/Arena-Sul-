import "server-only";

import { getInstagramOAuthPublicConfig } from "./config";
import { decryptInstagramToken, encryptInstagramToken } from "./crypto";
import {
  getInstagramRenewalDecision,
  InstagramTokenRenewalError,
  runInstagramTokenRenewal,
} from "./token-renewal";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export async function renewStoredInstagramToken() {
  const now = Date.now();
  const config = getInstagramOAuthPublicConfig();
  const supabase = createSupabaseServiceRoleClient();
  if (!config || !supabase) {
    throw new InstagramTokenRenewalError("configuration");
  }

  return runInstagramTokenRenewal({
    async readConnection() {
      const { data, error } = await supabase
        .from("instagram_connections")
        .select("instagram_user_id, token_ciphertext, token_iv, token_auth_tag, token_key_version, expires_at, last_refreshed_at")
        .eq("id", "arena-sul")
        .maybeSingle();

      if (error) throw new InstagramTokenRenewalError("read");
      if (!data) return null;
      if (data.token_key_version !== 1) {
        throw new InstagramTokenRenewalError("configuration");
      }

      const original = {
        userId: data.instagram_user_id,
        expiresAt: data.expires_at,
        lastRefreshedAt: data.last_refreshed_at,
        ciphertext: data.token_ciphertext,
      };

      // Expired or healthy tokens need no decryption or request to Meta.
      const accessToken = getInstagramRenewalDecision(original, now) === "due"
        ? decryptInstagramToken({
            encrypted: { ciphertext: data.token_ciphertext, iv: data.token_iv, authTag: data.token_auth_tag },
            appId: config.appId,
            userId: data.instagram_user_id,
          })
        : "";
      return { ...original, accessToken };
    },
    async persist(original, refreshed) {
      const encrypted = encryptInstagramToken({
        token: refreshed.accessToken,
        appId: config.appId,
        userId: original.userId,
      });
      const { data, error } = await supabase
        .from("instagram_connections")
        .update({
          token_ciphertext: encrypted.ciphertext,
          token_iv: encrypted.iv,
          token_auth_tag: encrypted.authTag,
          expires_at: refreshed.expiresAt,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq("id", "arena-sul")
        .eq("instagram_user_id", original.userId)
        .eq("token_ciphertext", original.ciphertext)
        .eq("last_refreshed_at", original.lastRefreshedAt)
        .select("id");

      if (error) throw new InstagramTokenRenewalError("storage");
      // A newer OAuth connection or another renewal won the race.
      return data.length === 1;
    },
  }, now);
}
