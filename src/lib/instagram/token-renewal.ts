const DAY_MS = 24 * 60 * 60 * 1000;
export const INSTAGRAM_TOKEN_RENEWAL_WINDOW_MS = 30 * DAY_MS;
export const INSTAGRAM_TOKEN_MIN_REFRESH_AGE_MS = DAY_MS;

export type InstagramRenewalConnection = {
  userId: string;
  accessToken: string;
  expiresAt: string;
  lastRefreshedAt: string;
};

export type InstagramRefreshedToken = {
  accessToken: string;
  expiresAt: string;
};

type RenewalErrorStage =
  | "configuration"
  | "read"
  | "request"
  | "response"
  | "storage";

// Do not attach the upstream error: fetch errors can contain the token URL.
export class InstagramTokenRenewalError extends Error {
  readonly stage: RenewalErrorStage;
  readonly upstreamStatus?: number;

  constructor(stage: RenewalErrorStage, upstreamStatus?: number) {
    super(`Instagram token renewal failed at ${stage}`);
    this.name = "InstagramTokenRenewalError";
    this.stage = stage;
    this.upstreamStatus = upstreamStatus;
  }
}

export function getInstagramRenewalDecision(
  connection: Pick<InstagramRenewalConnection, "expiresAt" | "lastRefreshedAt">,
  now = Date.now(),
): "invalid" | "expired" | "not-due" | "too-recent" | "due" {
  const expiresAt = Date.parse(connection.expiresAt);
  const lastRefreshedAt = Date.parse(connection.lastRefreshedAt);
  if (!Number.isFinite(now) || !Number.isFinite(expiresAt)) return "invalid";
  if (expiresAt <= now) return "expired";
  if (!Number.isFinite(lastRefreshedAt) || lastRefreshedAt > now) return "invalid";
  if (expiresAt - now > INSTAGRAM_TOKEN_RENEWAL_WINDOW_MS) return "not-due";
  if (now - lastRefreshedAt < INSTAGRAM_TOKEN_MIN_REFRESH_AGE_MS) {
    return "too-recent";
  }
  return "due";
}

export async function refreshInstagramAccessToken(
  accessToken: string,
  { fetcher = fetch, now = Date.now() }: { fetcher?: typeof fetch; now?: number } = {},
): Promise<InstagramRefreshedToken> {
  if (!accessToken || !Number.isFinite(now)) {
    throw new InstagramTokenRenewalError("configuration");
  }
  const endpoint = new URL("https://graph.instagram.com/refresh_access_token");
  endpoint.searchParams.set("grant_type", "ig_refresh_token");
  endpoint.searchParams.set("access_token", accessToken);

  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: "GET",
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new InstagramTokenRenewalError("request");
  }
  if (!response.ok) {
    throw new InstagramTokenRenewalError("request", response.status);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new InstagramTokenRenewalError("response");
  }
  const token = payload as Record<string, unknown> | null;
  if (
    !token ||
    typeof token !== "object" ||
    typeof token.access_token !== "string" ||
    token.access_token.length < 20 ||
    typeof token.expires_in !== "number" ||
    !Number.isSafeInteger(token.expires_in) ||
    token.expires_in <= 0 ||
    (token.token_type !== undefined &&
      (typeof token.token_type !== "string" || token.token_type.toLowerCase() !== "bearer"))
  ) {
    throw new InstagramTokenRenewalError("response");
  }
  const expiresAt = new Date(now + token.expires_in * 1000);
  if (!Number.isFinite(expiresAt.getTime())) {
    throw new InstagramTokenRenewalError("response");
  }
  return { accessToken: token.access_token, expiresAt: expiresAt.toISOString() };
}

export type InstagramTokenRenewalResult =
  | { status: "not-connected" | "reauthorization-required" | "not-due" | "too-recent" | "superseded" }
  | { status: "refreshed"; expiresAt: string };

export async function runInstagramTokenRenewal<C extends InstagramRenewalConnection>(
  dependencies: {
    readConnection: () => Promise<C | null>;
    refresh?: (accessToken: string) => Promise<InstagramRefreshedToken>;
    // Return false when the original connection was replaced concurrently.
    persist: (original: C, refreshed: InstagramRefreshedToken) => Promise<boolean>;
  },
  now = Date.now(),
): Promise<InstagramTokenRenewalResult> {
  let connection: C | null;
  try {
    connection = await dependencies.readConnection();
  } catch {
    throw new InstagramTokenRenewalError("read");
  }
  if (!connection) return { status: "not-connected" };
  const decision = getInstagramRenewalDecision(connection, now);
  if (decision === "invalid") throw new InstagramTokenRenewalError("configuration");
  if (decision === "expired") return { status: "reauthorization-required" };
  if (decision !== "due") return { status: decision };

  let refreshed: InstagramRefreshedToken;
  try {
    refreshed = await (dependencies.refresh ?? ((token) =>
      refreshInstagramAccessToken(token, { now })))(connection.accessToken);
  } catch (error) {
    if (error instanceof InstagramTokenRenewalError) throw error;
    throw new InstagramTokenRenewalError("request");
  }
  // Defensive validation also covers an injected refresh implementation.
  if (
    !refreshed ||
    typeof refreshed.accessToken !== "string" ||
    !refreshed.accessToken ||
    !(Date.parse(refreshed.expiresAt) > Date.parse(connection.expiresAt))
  ) {
    throw new InstagramTokenRenewalError("response");
  }
  let persisted: boolean;
  try {
    persisted = await dependencies.persist(connection, refreshed);
  } catch {
    throw new InstagramTokenRenewalError("storage");
  }
  return persisted
    ? { status: "refreshed", expiresAt: refreshed.expiresAt }
    : { status: "superseded" };
}
