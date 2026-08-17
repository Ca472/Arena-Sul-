export type RuntimeMode = "demo" | "supabase" | "misconfigured";

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

/**
 * With no environment file, local clones intentionally fall back to a clearly
 * labelled, non-persistent demo. Setting DEMO_MODE=false makes missing Supabase
 * configuration fail closed instead of exposing the admin preview.
 */
export function getRuntimeMode(): RuntimeMode {
  const requestedMode = process.env.DEMO_MODE?.trim().toLowerCase();

  if (requestedMode === "true") {
    return "demo";
  }

  if (getPublicSupabaseConfig()) {
    return "supabase";
  }

  return requestedMode === "false" ? "misconfigured" : "demo";
}

export function isDemoMode(): boolean {
  return getRuntimeMode() === "demo";
}
