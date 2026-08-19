import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicSupabaseConfig } from "@/lib/config/runtime";
import type { Database } from "@/lib/supabase/database.types";

/**
 * This client is deliberately isolated from the SSR auth client. Its key
 * bypasses RLS and must never be imported by a Client Component.
 */
export function createSupabaseServiceRoleClient() {
  const config = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return createClient<Database>(config.url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

