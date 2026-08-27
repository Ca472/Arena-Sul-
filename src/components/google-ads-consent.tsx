"use client";

import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import styles from "@/components/google-ads-consent.module.css";
import {
  GOOGLE_ADS_TAG_ID,
  GOOGLE_CONSENT_STORAGE_KEY,
  type GoogleConsentChoice,
  getGoogleConsentSignals,
  isGoogleAdsPublicPath,
  parseStoredGoogleConsent,
  serializeGoogleConsent,
} from "@/lib/google-ads/consent";

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

function updateGoogleConsent(choice: GoogleConsentChoice | null) {
  window.gtag?.("consent", "update", getGoogleConsentSignals(choice));
}

function readStoredChoice(): GoogleConsentChoice | null {
  try {
    return parseStoredGoogleConsent(
      window.localStorage.getItem(GOOGLE_CONSENT_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function storeChoice(choice: GoogleConsentChoice): boolean {
  try {
    window.localStorage.setItem(
      GOOGLE_CONSENT_STORAGE_KEY,
      serializeGoogleConsent(choice),
    );
    return true;
  } catch {
    // The consent state still applies to the current page when storage is off.
    return false;
  }
}

const CONSENT_CHANGE_EVENT = "arena-sul-google-consent-change";

function subscribeToStoredChoice(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CONSENT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

export function GoogleAdsConsent() {
  const pathname = usePathname();
  const isPublicPath = isGoogleAdsPublicPath(pathname);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [unpersistedChoice, setUnpersistedChoice] =
    useState<GoogleConsentChoice | null>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const storedChoice = useSyncExternalStore(
    subscribeToStoredChoice,
    readStoredChoice,
    () => null,
  );
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const effectiveChoice = unpersistedChoice ?? storedChoice;
  const shouldShowPanel =
    isHydrated && (isPanelOpen || effectiveChoice === null);
  const lastAppliedConsent = useRef(
    isPublicPath && effectiveChoice === "accepted",
  );

  useEffect(() => {
    const shouldGrantConsent =
      isPublicPath && effectiveChoice === "accepted";

    if (lastAppliedConsent.current !== shouldGrantConsent) {
      updateGoogleConsent(shouldGrantConsent ? "accepted" : null);
      lastAppliedConsent.current = shouldGrantConsent;
    }
  }, [effectiveChoice, isPublicPath]);

  function saveChoice(nextChoice: GoogleConsentChoice) {
    const wasStored = storeChoice(nextChoice);
    setUnpersistedChoice(wasStored ? null : nextChoice);
    updateGoogleConsent(nextChoice);
    lastAppliedConsent.current = nextChoice === "accepted";
    setIsPanelOpen(false);
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));

    window.requestAnimationFrame(() => {
      settingsButtonRef.current?.focus();
    });
  }

  function openPanel() {
    setIsPanelOpen(true);

    window.requestAnimationFrame(() => {
      rejectButtonRef.current?.focus();
    });
  }

  if (!isPublicPath) {
    return null;
  }

  return (
    <>
      <Script
        id="google-ads-library"
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-config" strategy="afterInteractive">
        {`
          window.gtag("js", new Date());
          window.gtag("config", "${GOOGLE_ADS_TAG_ID}");
        `}
      </Script>

      {shouldShowPanel ? (
        <section
          className={styles.banner}
          role="region"
          aria-labelledby="google-consent-title"
          aria-describedby="google-consent-description"
        >
          <div className={styles.copy}>
            <h2 id="google-consent-title">Sua privacidade na Arena Sul</h2>
            <p id="google-consent-description">
              Usamos a Google tag para medir o desempenho das campanhas. Você
              pode aceitar ou recusar o uso de dados para publicidade e
              análise, e mudar sua escolha quando quiser.
            </p>
            <Link className={styles.privacyLink} href="/privacidade">
              Entenda como funciona
            </Link>
          </div>

          <div className={styles.actions}>
            <button
              ref={rejectButtonRef}
              className={styles.rejectButton}
              type="button"
              onClick={() => saveChoice("rejected")}
            >
              Recusar
            </button>
            <button
              className={styles.acceptButton}
              type="button"
              onClick={() => saveChoice("accepted")}
            >
              Aceitar
            </button>
          </div>
        </section>
      ) : null}

      {isHydrated && !shouldShowPanel ? (
        <button
          ref={settingsButtonRef}
          className={styles.settingsButton}
          type="button"
          onClick={openPanel}
          aria-label={`Abrir preferências de privacidade. Escolha atual: ${
            effectiveChoice === "accepted" ? "aceita" : "recusada"
          }.`}
        >
          Preferências de privacidade
        </button>
      ) : null}
    </>
  );
}
