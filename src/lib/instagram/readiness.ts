import "server-only";

import { getInstagramOAuthSecretConfig } from "@/lib/instagram/config";
import { isInstagramTokenEncryptionConfigured } from "@/lib/instagram/crypto";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export function isInstagramOAuthReady() {
  return Boolean(
    getInstagramOAuthSecretConfig() &&
      isInstagramTokenEncryptionConfigured() &&
      createSupabaseServiceRoleClient(),
  );
}
