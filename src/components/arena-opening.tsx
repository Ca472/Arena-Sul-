"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./arena-opening.module.css";

const OPENING_DURATION_MS = 2100;
const ASSET_WAIT_LIMIT_MS = 1800;

type ArenaOpeningProps = {
  children: ReactNode;
};

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
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    if (reducedMotionQuery.matches) {
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

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        dismiss();
      }
    };

    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);

    return () => {
      active = false;

      if (assetWaitTimer !== undefined) {
        window.clearTimeout(assetWaitTimer);
      }

      if (dismissTimer !== undefined) {
        window.clearTimeout(dismissTimer);
      }

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
      aria-hidden="true"
    >
      <noscript>
        <style>{"[data-arena-opening] { display: none !important; }"}</style>
      </noscript>
      {children}
    </div>
  );
}
