"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./arena-opening.module.css";

const OPENING_SEEN_KEY = "arena-sul-opening-seen";
const OPENING_DURATION_MS = 2100;
const ASSET_WAIT_LIMIT_MS = 1800;

type ArenaOpeningProps = {
  children: ReactNode;
};

function hasSeenOpening() {
  try {
    return sessionStorage.getItem(OPENING_SEEN_KEY) === "yes";
  } catch {
    return false;
  }
}

function rememberOpening() {
  try {
    sessionStorage.setItem(OPENING_SEEN_KEY, "yes");
  } catch {
    // The intro can safely run again when session storage is unavailable.
  }
}

async function waitForImage(image: HTMLImageElement) {
  if (!image.complete) {
    await new Promise<void>((resolve) => {
      const finish = () => {
        image.removeEventListener("load", finish);
        image.removeEventListener("error", finish);
        resolve();
      };

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
    });
  }

  if (image.naturalWidth > 0 && typeof image.decode === "function") {
    await image.decode().catch(() => undefined);
  }
}

export function ArenaOpening({ children }: ArenaOpeningProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    const overlay = overlayRef.current;

    if (overlay?.contains(document.activeElement)) {
      restoreFocusRef.current = true;
    }

    rememberOpening();
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (hasSeenOpening() || reducedMotionQuery.matches) {
      queueMicrotask(dismiss);
      return;
    }

    const overlay = overlayRef.current;

    const portal = document.querySelector<HTMLElement>("main.public-site");
    const previousOverflow = document.body.style.overflow;
    const previousInert = portal?.inert ?? false;
    const previousAriaHidden = portal?.getAttribute("aria-hidden");
    let active = true;
    let hasStarted = false;
    let dismissTimer: number | undefined;
    const assetWaitTimer = window.setTimeout(
      dismiss,
      ASSET_WAIT_LIMIT_MS,
    );

    const startOpening = () => {
      const assets = Array.from(
        overlay?.querySelectorAll<HTMLImageElement>("img[data-intro-asset]") ??
          [],
      );
      const assetsReady =
        assets.length > 0 &&
        assets.every((image) => image.complete && image.naturalWidth > 0);

      if (!active || hasStarted || !overlay?.isConnected) {
        return;
      }

      if (!assetsReady) {
        dismiss();
        return;
      }

      hasStarted = true;

      if (assetWaitTimer !== undefined) {
        window.clearTimeout(assetWaitTimer);
      }

      overlay.dataset.introReady = "true";
      dismissTimer = window.setTimeout(dismiss, OPENING_DURATION_MS);
    };

    const assets = Array.from(
      overlay?.querySelectorAll<HTMLImageElement>("img[data-intro-asset]") ??
        [],
    );

    void Promise.all(assets.map(waitForImage)).then(startOpening, dismiss);

    document.body.style.overflow = "hidden";

    if (portal) {
      portal.inert = true;
      portal.setAttribute("aria-hidden", "true");
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const controls = Array.from(
        overlayRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

      if (controls.length === 0) {
        event.preventDefault();
        return;
      }

      const firstControl = controls[0];
      const lastControl = controls.at(-1);

      if (!overlay?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? lastControl : firstControl)?.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl?.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!overlay?.contains(event.target as Node)) {
        overlay?.querySelector<HTMLElement>("button")?.focus();
      }
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        dismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    const focusFrame = window.requestAnimationFrame(() => {
      overlay?.querySelector<HTMLElement>("button")?.focus();
    });

    return () => {
      active = false;
      const shouldRestoreFocus =
        restoreFocusRef.current ||
        Boolean(overlay?.contains(document.activeElement));

      if (assetWaitTimer !== undefined) {
        window.clearTimeout(assetWaitTimer);
      }

      if (dismissTimer !== undefined) {
        window.clearTimeout(dismissTimer);
      }

      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      document.body.style.overflow = previousOverflow;

      if (portal) {
        portal.inert = previousInert;

        if (
          previousAriaHidden === null ||
          previousAriaHidden === undefined
        ) {
          portal.removeAttribute("aria-hidden");
        } else {
          portal.setAttribute("aria-hidden", previousAriaHidden);
        }
      }

      if (shouldRestoreFocus) {
        window.requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>(".hero-title")
            ?.focus({ preventScroll: true });
          restoreFocusRef.current = false;
        });
      }
    };
  }, [dismiss, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      data-arena-opening
      role="dialog"
      aria-modal="true"
      aria-label="Abertura da Arena Sul Sports"
    >
      <noscript>
        <style>{"[data-arena-opening] { display: none !important; }"}</style>
      </noscript>
      {children}
      <button className={styles.skipButton} type="button" onClick={dismiss}>
        Pular abertura
      </button>
    </div>
  );
}
