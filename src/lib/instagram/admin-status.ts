import type { InstagramFeedStatus } from "./types";

export type InstagramAdminConnectionStatus =
  | "connected"
  | "expired"
  | "api-unavailable"
  | "credentials-unavailable"
  | "awaiting-authorization"
  | "unconfigured";

export function resolveInstagramAdminConnectionStatus({
  oauthReady,
  hasConnection,
  expired,
  hasCredentials,
  liveStatus,
}: {
  oauthReady: boolean;
  hasConnection: boolean;
  expired: boolean;
  hasCredentials: boolean;
  liveStatus: InstagramFeedStatus;
}): InstagramAdminConnectionStatus {
  if (!hasConnection) {
    return oauthReady ? "awaiting-authorization" : "unconfigured";
  }

  if (expired) {
    return "expired";
  }

  if (!hasCredentials || liveStatus === "unconfigured") {
    return "credentials-unavailable";
  }

  return liveStatus === "connected" ? "connected" : "api-unavailable";
}
