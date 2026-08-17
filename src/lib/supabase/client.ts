"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/config/runtime";
import { SUPABASE_COOKIE_OPTIONS } from "@/lib/supabase/cookie-options";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createBrowserClient<Database>(config.url, config.anonKey, {
    cookieOptions: SUPABASE_COOKIE_OPTIONS,
  });
  return browserClient;
}
