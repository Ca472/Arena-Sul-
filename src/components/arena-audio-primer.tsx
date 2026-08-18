"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ARENA_AUDIO_READY_EVENT,
  discardArenaAudioContext,
  getExistingArenaAudioContext,
  isArenaSoundEnabled,
  unlockArenaAudio,
} from "@/lib/audio/arena-impact";

function isPublicPortalPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/eventos" ||
    pathname.startsWith("/eventos/")
  );
}

export function ArenaAudioPrimer() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isPublicPortalPath(pathname)) {
      return;
    }

    let isUnlocking = false;
    let needsRefresh = false;
    let attemptGeneration = 0;
    let isMounted = true;

    const markForRefresh = () => {
      needsRefresh = true;
      attemptGeneration += 1;
      isUnlocking = false;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        markForRefresh();
      }
    };

    const unlockFromGesture = () => {
      const existingContext = getExistingArenaAudioContext();

      if (
        isUnlocking ||
        !isArenaSoundEnabled() ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        (existingContext?.state === "running" && !needsRefresh)
      ) {
        return;
      }

      isUnlocking = true;
      const currentAttempt = attemptGeneration + 1;
      attemptGeneration = currentAttempt;
      const releaseGuardTimer = window.setTimeout(() => {
        if (attemptGeneration === currentAttempt) {
          attemptGeneration += 1;
          isUnlocking = false;
        }
      }, 1500);

      void (async () => {
        if (needsRefresh && existingContext?.state === "running") {
          discardArenaAudioContext();
        }

        const context = await unlockArenaAudio();

        if (
          isMounted &&
          attemptGeneration === currentAttempt &&
          document.visibilityState === "visible" &&
          isArenaSoundEnabled() &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
          context?.state === "running"
        ) {
          needsRefresh = false;
          window.dispatchEvent(new Event(ARENA_AUDIO_READY_EVENT));
        }
      })()
        .catch(() => {
          // A later interaction can retry if mobile Safari interrupts audio.
        })
        .finally(() => {
          window.clearTimeout(releaseGuardTimer);

          if (attemptGeneration === currentAttempt) {
            isUnlocking = false;
          }
        });
    };

    window.addEventListener("pointerdown", unlockFromGesture, {
      capture: true,
      passive: true,
    });
    window.addEventListener("keydown", unlockFromGesture, { capture: true });
    window.addEventListener("pagehide", markForRefresh);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      attemptGeneration += 1;
      window.removeEventListener("pointerdown", unlockFromGesture, true);
      window.removeEventListener("keydown", unlockFromGesture, true);
      window.removeEventListener("pagehide", markForRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname]);

  return null;
}
