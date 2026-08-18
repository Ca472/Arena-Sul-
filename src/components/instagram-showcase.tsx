"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type {
  InstagramFeed,
  InstagramMediaItem,
} from "@/lib/instagram/types";
import styles from "./instagram-showcase.module.css";

const INSTAGRAM_PROFILE_URL =
  "https://www.instagram.com/arenasulsports/";
const INSTAGRAM_STORIES_URL =
  "https://www.instagram.com/stories/arenasulsports/";
const STORY_ROTATION_MS = 7000;

const instagramDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "America/Sao_Paulo",
});

function ArenaStoryBadge() {
  return (
    <span className={styles.storyRing} aria-hidden="true">
      <span className={styles.storyRingInner}>
        <Image
          className={styles.storyLogo}
          src="/images/arena-sul-logo.png"
          alt=""
          width={72}
          height={72}
        />
      </span>
    </span>
  );
}

function ControlledStoryVideo({
  item,
  shouldPlay,
}: {
  item: InstagramMediaItem;
  shouldPlay: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!shouldPlay) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      // Browser autoplay policies may still require an explicit user gesture.
    });
  }, [item.id, shouldPlay]);

  return (
    <video
      ref={videoRef}
      src={item.mediaUrl}
      poster={item.thumbnailUrl ?? undefined}
      autoPlay={shouldPlay}
      controls
      loop={shouldPlay}
      muted
      playsInline
      preload="metadata"
    />
  );
}

function MediaVisual({
  item,
  sizes,
  shouldAutoPlay = false,
  videoControls = false,
}: {
  item: InstagramMediaItem;
  sizes: string;
  shouldAutoPlay?: boolean;
  videoControls?: boolean;
}) {
  if (item.mediaType === "VIDEO" && videoControls) {
    return (
      <ControlledStoryVideo
        key={item.id}
        item={item}
        shouldPlay={shouldAutoPlay}
      />
    );
  }

  const previewUrl = item.thumbnailUrl ?? item.mediaUrl;

  return (
    <Image
      src={previewUrl}
      alt=""
      fill
      sizes={sizes}
      unoptimized
    />
  );
}

function InstagramProfileFallback() {
  return (
    <div className={styles.fallbackGrid}>
      <div className={styles.profileFallback}>
        <Image
          src="/images/arena-sul-logo-white.png"
          alt=""
          width={118}
          height={118}
        />
        <p className={styles.eyebrow}>Direto da Arena</p>
        <h3>@arenasulsports</h3>
        <p>
          Veja os Reels, treinos, encontros em família e bastidores publicados
          no perfil oficial da Arena Sul.
        </p>
        <a
          className={styles.storyLink}
          href={INSTAGRAM_PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir Instagram <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className={styles.storyFallback}>
        <ArenaStoryBadge />
        <p className={styles.eyebrow}>Stories da Arena</p>
        <h3>Veja o que está acontecendo agora.</h3>
        <p>
          Acompanhe os Stories ativos e abra os Reels mais recentes direto no
          perfil oficial.
        </p>
        <a
          className={styles.storyLink}
          href={INSTAGRAM_STORIES_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver Stories atuais <span aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  );
}

export function InstagramShowcase({ feed }: { feed: InstagramFeed }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);

  const stories = feed.stories;
  const reels = feed.reels;
  const normalizedStoryIndex =
    stories.length > 0 ? activeStoryIndex % stories.length : 0;
  const activeStory = stories[normalizedStoryIndex] ?? null;
  const hasLiveMedia =
    feed.status === "connected" &&
    (stories.length > 0 || reels.length > 0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setMotionAllowed(!mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.28 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setPageVisible(document.visibilityState === "visible");
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (
      stories.length < 2 ||
      interactionPaused ||
      manualPaused ||
      !isVisible ||
      !pageVisible ||
      !motionAllowed
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStoryIndex((index) => (index + 1) % stories.length);
    }, STORY_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [
    interactionPaused,
    isVisible,
    manualPaused,
    motionAllowed,
    pageVisible,
    stories.length,
  ]);

  const visibleReels = reels.slice(0, 4);
  const shouldPlayActiveStory =
    motionAllowed &&
    isVisible &&
    pageVisible &&
    !interactionPaused &&
    !manualPaused;

  if (!hasLiveMedia) {
    return <InstagramProfileFallback />;
  }

  return (
    <div
      ref={rootRef}
      className={styles.showcase}
      onPointerEnter={() => setInteractionPaused(true)}
      onPointerLeave={() => setInteractionPaused(false)}
      onFocus={() => setInteractionPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteractionPaused(false);
        }
      }}
    >
      <div className={styles.storyColumn}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Stories ativos</p>
            <h3>Agora na Arena</h3>
          </div>
          {stories.length > 1 ? (
            <div className={styles.storyStatus}>
              <span>
                {String(normalizedStoryIndex + 1).padStart(2, "0")} /{" "}
                {String(stories.length).padStart(2, "0")}
              </span>
              {motionAllowed ? (
                <button
                  type="button"
                  aria-pressed={manualPaused}
                  onClick={() => setManualPaused((paused) => !paused)}
                >
                  {manualPaused ? "Retomar" : "Pausar"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {activeStory ? (
          <>
            <div className={styles.storyStage}>
              <MediaVisual
                item={activeStory}
                sizes="(max-width: 760px) 88vw, 360px"
                shouldAutoPlay={shouldPlayActiveStory}
                videoControls
              />
              <a
                className={styles.mediaExternalLink}
                href={activeStory.permalink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir este Story no Instagram"
              >
                Ver no Instagram <span aria-hidden="true">↗</span>
              </a>
            </div>

            {stories.length > 1 ? (
              <div className={styles.storyControls} aria-label="Escolher Story">
                {stories.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    aria-label={`Mostrar Story ${index + 1}`}
                    aria-current={index === normalizedStoryIndex ? "true" : undefined}
                    onClick={() => setActiveStoryIndex(index)}
                  >
                    <span />
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className={styles.noStory}>
            <ArenaStoryBadge />
            <p>Nenhum Story ativo neste momento.</p>
            <a href={INSTAGRAM_STORIES_URL} target="_blank" rel="noopener noreferrer">
              Abrir Stories <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </div>

      <div className={styles.reelsColumn}>
        <div className={styles.panelHeading}>
          <div>
            <p className={styles.eyebrow}>Reels recentes</p>
            <h3>Movimento que inspira</h3>
          </div>
          <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
            Ver perfil <span aria-hidden="true">↗</span>
          </a>
        </div>

        {visibleReels.length > 0 ? (
          <div className={styles.reelRail}>
            {visibleReels.map((reel) => (
              <a
                className={styles.reelCard}
                href={reel.permalink}
                key={reel.id}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.reelMedia}>
                  <MediaVisual
                    item={reel}
                    sizes="(max-width: 600px) 72vw, (max-width: 1000px) 36vw, 220px"
                  />
                  <span className={styles.playIcon} aria-hidden="true">▶</span>
                </span>
                <span className={styles.reelMeta}>
                  <span>{instagramDateFormatter.format(new Date(reel.timestamp))}</span>
                  <strong>{reel.caption || "Novo Reel da Arena Sul"}</strong>
                </span>
              </a>
            ))}
          </div>
        ) : (
          <div className={styles.noReels}>
            <p>Os próximos Reels publicados aparecerão aqui automaticamente.</p>
            <a href={INSTAGRAM_PROFILE_URL} target="_blank" rel="noopener noreferrer">
              Abrir @arenasulsports <span aria-hidden="true">↗</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
