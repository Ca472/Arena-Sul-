"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./arena-opening.module.css";

const OPENING_SEEN_KEY = "arena-sul-opening-seen";
const OPENING_DURATION_MS = 2300;
const LOADER_REPLAY_EVENT = "arena-sul:loader-replay";

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

export function ArenaOpening({ children }: ArenaOpeningProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  const dismiss = useCallback(() => {
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

    if (
      overlay
        ?.getAnimations()
        .some((animation) => animation.playState === "finished")
    ) {
      queueMicrotask(dismiss);
      return;
    }

    const portal = document.querySelector<HTMLElement>("main.public-site");
    const previousOverflow = document.body.style.overflow;
    const previousInert = portal?.inert ?? false;
    const previousAriaHidden = portal?.getAttribute("aria-hidden");
    let dismissTimer = window.setTimeout(dismiss, OPENING_DURATION_MS);

    document.body.style.overflow = "hidden";

    if (portal) {
      portal.inert = true;
      portal.setAttribute("aria-hidden", "true");
    }

    const restartDismissTimer = () => {
      window.clearTimeout(dismissTimer);
      dismissTimer = window.setTimeout(dismiss, OPENING_DURATION_MS);

      for (const animation of overlay?.getAnimations() ?? []) {
        animation.cancel();
        animation.play();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      restartDismissTimer();

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

    const handlePointerDown = () => {
      restartDismissTimer();
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!overlay?.contains(event.target as Node)) {
        overlay?.querySelector<HTMLElement>("button")?.focus();
        return;
      }

      restartDismissTimer();
    };

    const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        dismiss();
      }
    };

    window.addEventListener(LOADER_REPLAY_EVENT, restartDismissTimer);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    overlay?.addEventListener("pointerdown", handlePointerDown);

    const focusFrame = window.requestAnimationFrame(() => {
      overlay?.querySelector<HTMLElement>("button")?.focus();
    });

    return () => {
      const shouldRestoreFocus = overlay?.contains(document.activeElement);

      window.clearTimeout(dismissTimer);
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener(LOADER_REPLAY_EVENT, restartDismissTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      reducedMotionQuery.removeEventListener(
        "change",
        handleMotionPreferenceChange,
      );
      overlay?.removeEventListener("pointerdown", handlePointerDown);
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
