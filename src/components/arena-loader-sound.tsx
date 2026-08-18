"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ARENA_AUDIO_READY_EVENT,
  discardArenaAudioContext,
  getExistingArenaAudioContext,
  isArenaSoundEnabled,
  scheduleArenaImpact,
  setArenaSoundEnabled,
  unlockArenaAudio,
} from "@/lib/audio/arena-impact";
import styles from "./arena-loader.module.css";

const IMPACT_DELAY_MS = 850;
const UNLOCK_TIMEOUT_MS = 1200;
const LOADER_REPLAY_EVENT = "arena-sul:loader-replay";

function isPublicPortalPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/eventos" ||
    pathname.startsWith("/eventos/")
  );
}

async function unlockWithTimeout() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      unlockArenaAudio(),
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), UNLOCK_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export function ArenaLoaderSound() {
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cancelImpactRef = useRef<(() => void) | null>(null);
  const hasPlayedRef = useRef(false);
  const mountedRef = useRef(false);
  const activationGenerationRef = useRef(0);
  const activationPendingRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activationPending, setActivationPending] = useState(false);

  const clearScheduledImpact = useCallback(() => {
    cancelImpactRef.current?.();
    cancelImpactRef.current = null;
  }, []);

  const restartScene = useCallback(() => {
    const loader = buttonRef.current?.closest("[data-arena-loader]");
    const scene = loader?.querySelector("[data-arena-loader-scene]");

    if (!(scene instanceof HTMLElement)) {
      return;
    }

    for (const animation of scene.getAnimations({ subtree: true })) {
      animation.cancel();
      animation.play();
    }
  }, []);

  const scheduleImpact = useCallback(
    (
      context: AudioContext,
      restart = true,
      delayMs = IMPACT_DELAY_MS,
    ) => {
      clearScheduledImpact();

      if (restart) {
        restartScene();
      }

      if (
        hasPlayedRef.current ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      hasPlayedRef.current = true;
      cancelImpactRef.current = scheduleArenaImpact(
        context,
        Math.max(0, delayMs) / 1000,
      );
    },
    [clearScheduledImpact, restartScene],
  );

  useEffect(() => {
    mountedRef.current = true;

    const handleAudioReady = () => {
      const context = getExistingArenaAudioContext();
      const enabled = isArenaSoundEnabled();

      if (mountedRef.current) {
        setSoundEnabled(enabled);
      }

      if (
        !mountedRef.current ||
        !isPublicPortalPath(pathname) ||
        !enabled ||
        hasPlayedRef.current ||
        document.visibilityState !== "visible" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        context?.state !== "running"
      ) {
        return;
      }

      scheduleImpact(context);
    };

    window.addEventListener(ARENA_AUDIO_READY_EVENT, handleAudioReady);
    queueMicrotask(handleAudioReady);

    return () => {
      mountedRef.current = false;
      activationGenerationRef.current += 1;
      activationPendingRef.current = false;
      window.removeEventListener(ARENA_AUDIO_READY_EVENT, handleAudioReady);
      clearScheduledImpact();
    };
  }, [clearScheduledImpact, pathname, scheduleImpact]);

  useEffect(() => {
    const cancelWhenHidden = () => {
      if (document.visibilityState !== "visible") {
        clearScheduledImpact();
      }
    };

    document.addEventListener("visibilitychange", cancelWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", cancelWhenHidden);
    };
  }, [clearScheduledImpact]);

  if (!isPublicPortalPath(pathname)) {
    return null;
  }

  const handleSoundToggle = async () => {
    if (activationPendingRef.current) {
      return;
    }

    if (soundEnabled) {
      activationGenerationRef.current += 1;
      clearScheduledImpact();
      setArenaSoundEnabled(false);
      setSoundEnabled(false);
      discardArenaAudioContext();
      return;
    }

    const activationGeneration = activationGenerationRef.current + 1;
    activationGenerationRef.current = activationGeneration;
    activationPendingRef.current = true;
    setActivationPending(true);
    const activationStartedAt = performance.now();

    window.dispatchEvent(new Event(LOADER_REPLAY_EVENT));
    restartScene();

    try {
      const context = await unlockWithTimeout();

      if (
        !context ||
        context.state !== "running" ||
        getExistingArenaAudioContext() !== context ||
        !mountedRef.current ||
        activationGenerationRef.current !== activationGeneration ||
        !buttonRef.current?.isConnected ||
        document.visibilityState !== "visible" ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      hasPlayedRef.current = false;
      setArenaSoundEnabled(true);
      setSoundEnabled(true);

      const elapsedMs = performance.now() - activationStartedAt;

      if (elapsedMs <= 500) {
        scheduleImpact(context, false, IMPACT_DELAY_MS - elapsedMs);
      } else {
        window.dispatchEvent(new Event(LOADER_REPLAY_EVENT));
        scheduleImpact(context, true);
      }
    } catch {
      // Autoplay policies vary; the visual loader remains the fallback.
    } finally {
      if (
        mountedRef.current &&
        activationGenerationRef.current === activationGeneration
      ) {
        activationPendingRef.current = false;
        setActivationPending(false);
      }
    }
  };

  return (
    <button
      ref={buttonRef}
      className={styles.soundButton}
      type="button"
      aria-pressed={soundEnabled}
      aria-busy={activationPending || undefined}
      aria-disabled={activationPending || undefined}
      onClick={handleSoundToggle}
    >
      <span className={styles.soundIcon} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      Som da abertura
    </button>
  );
}
