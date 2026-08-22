import type { InstagramFeedStatus } from "./types";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export const INSTAGRAM_RENEWAL_NOTICE_DAYS = 30;
export const INSTAGRAM_RENEWAL_URGENT_DAYS = 7;

export type InstagramAdminConnectionStatus =
  | "connected"
  | "expired"
  | "api-unavailable"
  | "credentials-unavailable"
  | "awaiting-authorization"
  | "unconfigured";

export type InstagramExpiryLevel =
  | "healthy"
  | "attention"
  | "urgent"
  | "expired"
  | "unavailable";

export type InstagramExpiryCountdown = {
  level: InstagramExpiryLevel;
  label: string;
  remainingMs: number | null;
  shouldRenew: boolean;
};

function pluralize(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function formatRemainingTime(remainingMs: number) {
  const totalMinutes = Math.max(1, Math.ceil(remainingMs / MINUTE_MS));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) {
    parts.push(pluralize(days, "dia", "dias"));
  }

  if (hours > 0) {
    parts.push(pluralize(hours, "hora", "horas"));
  }

  if (minutes > 0 || parts.length === 0) {
    parts.push(pluralize(minutes, "minuto", "minutos"));
  }

  return parts.join(", ");
}

export function getInstagramExpiryCountdown(
  expiresAt: string | null,
  nowMs: number,
): InstagramExpiryCountdown {
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;

  if (!Number.isFinite(expiryMs) || !Number.isFinite(nowMs)) {
    return {
      level: "unavailable",
      label: "Data de expiração indisponível",
      remainingMs: null,
      shouldRenew: true,
    };
  }

  const remainingMs = expiryMs - nowMs;
  if (remainingMs <= 0) {
    return {
      level: "expired",
      label: "Autorização expirada",
      remainingMs: 0,
      shouldRenew: true,
    };
  }

  const urgentWindowMs = INSTAGRAM_RENEWAL_URGENT_DAYS * DAY_MS;
  const noticeWindowMs = INSTAGRAM_RENEWAL_NOTICE_DAYS * DAY_MS;
  const level: InstagramExpiryLevel =
    remainingMs <= urgentWindowMs
      ? "urgent"
      : remainingMs <= noticeWindowMs
        ? "attention"
        : "healthy";

  return {
    level,
    label: formatRemainingTime(remainingMs),
    remainingMs,
    shouldRenew: level !== "healthy",
  };
}

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
