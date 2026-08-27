export const GOOGLE_ADS_TAG_ID = "AW-18397690648";

export const GOOGLE_CONSENT_STORAGE_KEY =
  "arena-sul-google-consent-preference";

export const GOOGLE_CONSENT_STORAGE_VERSION = 1;

export type GoogleConsentChoice = "accepted" | "rejected";

export type GoogleConsentSignals = {
  ad_storage: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
};

type StoredGoogleConsent = {
  choice: GoogleConsentChoice;
  version: typeof GOOGLE_CONSENT_STORAGE_VERSION;
};

const SENSITIVE_PATH_PREFIXES = ["/admin", "/auth", "/integracoes"] as const;

export function getGoogleConsentSignals(
  choice: GoogleConsentChoice | null,
): GoogleConsentSignals {
  const value = choice === "accepted" ? "granted" : "denied";

  return {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  };
}

export function isGoogleAdsPublicPath(pathname: string): boolean {
  return !SENSITIVE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function parseStoredGoogleConsent(
  storedValue: string | null,
): GoogleConsentChoice | null {
  if (!storedValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<StoredGoogleConsent>;

    if (
      parsed.version === GOOGLE_CONSENT_STORAGE_VERSION &&
      (parsed.choice === "accepted" || parsed.choice === "rejected")
    ) {
      return parsed.choice;
    }
  } catch {
    return null;
  }

  return null;
}

export function serializeGoogleConsent(choice: GoogleConsentChoice): string {
  const storedConsent: StoredGoogleConsent = {
    choice,
    version: GOOGLE_CONSENT_STORAGE_VERSION,
  };

  return JSON.stringify(storedConsent);
}

export function buildGoogleConsentBootstrapScript(): string {
  const storageKey = JSON.stringify(GOOGLE_CONSENT_STORAGE_KEY);
  const storageVersion = JSON.stringify(GOOGLE_CONSENT_STORAGE_VERSION);

  return `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};

    var arenaSulConsentChoice = null;
    try {
      var arenaSulStoredConsent = JSON.parse(
        window.localStorage.getItem(${storageKey}) || "null"
      );
      if (
        arenaSulStoredConsent &&
        arenaSulStoredConsent.version === ${storageVersion} &&
        (arenaSulStoredConsent.choice === "accepted" ||
          arenaSulStoredConsent.choice === "rejected")
      ) {
        arenaSulConsentChoice = arenaSulStoredConsent.choice;
      }
    } catch (error) {
      arenaSulConsentChoice = null;
    }

    var arenaSulConsentValue =
      arenaSulConsentChoice === "accepted" ? "granted" : "denied";

    window.gtag("consent", "default", {
      ad_storage: arenaSulConsentValue,
      analytics_storage: arenaSulConsentValue,
      ad_user_data: arenaSulConsentValue,
      ad_personalization: arenaSulConsentValue
    });
  `;
}
