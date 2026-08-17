"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getPublicSupabaseConfig } from "@/lib/config/runtime";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createSupabaseBrowserClient() {
  const config = getPublicSupabaseConfig();

  if (!config) {
    return null;
  }

  browserClient ??= createBrowserClient<Database>(config.url, config.anonKey);
  return browserClient;
}
