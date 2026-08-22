"use client";

import Image from "next/image";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  areInstagramStoriesEqual,
  findStoryIndexAfterRefresh,
  getAdjacentStoryIndex,
  getInstagramStoriesRefreshDelay,
  getInstagramStoriesSnapshotTimestamp,
  getStorySwipeDirection,
  INSTAGRAM_STORIES_MIN_REFRESH_MS,
  INSTAGRAM_STORIES_REFRESH_MS,
  isInstagramStoriesSnapshot,
} from "@/lib/instagram/live-sync";
import type {
  InstagramFeed,
  InstagramFeedStatus,
  InstagramMediaItem,
  InstagramStoriesSnapshot,
} from "@/lib/instagram/types";
import styles from "./instagram-showcase.module.css";

const INSTAGRAM_PROFILE_URL = "https://www.instagram.com/arenasulsports/";
const INSTAGRAM_STORIES_URL =
  "https://www.instagram.com/stories/arenasulsports/";
const STORY_ROTATION_MS = 7000;

type LiveStoriesState = {
  status: InstagramFeedStatus;
  stories: InstagramMediaItem[];
  fetchedAt: string | null;
  activeStoryId: string | null;
};

type LiveStoriesAction =
  | { type: "replace"; snapshot: InstagramStoriesSnapshot }
  | { type: "select"; storyId: string }
  | {
      type: "navigate";
      direction: "previous" | "next";
      stories: InstagramMediaItem[];
    }
  | { type: "advance"; stories: InstagramMediaItem[] };

function createLiveStoriesState(feed: InstagramFeed): LiveStoriesState {
  return {
    status: feed.status,
    stories: feed.stories,
    fetchedAt: feed.storiesFetchedAt,
    activeStoryId: feed.stories[0]?.id ?? null,
  };
}

function liveStoriesReducer(
  state: LiveStoriesState,
  action: LiveStoriesAction,
): LiveStoriesState {
  if (action.type === "select") {
    return { ...state, activeStoryId: action.storyId };
  }

  if (action.type === "advance") {
    if (action.stories.length < 2) {
      return state;
    }
    const currentIndex = findStoryIndexAfterRefresh(
      state.activeStoryId,
      action.stories,
    );
    const nextStory =
      action.stories[(currentIndex + 1) % action.stories.length];
    return nextStory ? { ...state, activeStoryId: nextStory.id } : state;
  }

  if (action.type === "navigate") {
    if (action.stories.length < 2) {
      return state;
    }
    const nextIndex = getAdjacentStoryIndex(
      state.activeStoryId,
      action.stories,
      action.direction,
    );
    const nextStory = action.stories[nextIndex];
    return nextStory ? { ...state, activeStoryId: nextStory.id } : state;
  }

  if (
    state.status === "connected" &&
    areInstagramStoriesEqual(state.stories, action.snapshot.stories)
  ) {
    return { ...state, fetchedAt: action.snapshot.fetchedAt };
  }

  const nextActiveIndex = findStoryIndexAfterRefresh(
    state.activeStoryId,
    action.snapshot.stories,
  );
  return {
    status: action.snapshot.status,
    stories: action.snapshot.stories,
    fetchedAt: action.snapshot.fetchedAt,
    activeStoryId: action.snapshot.stories[nextActiveIndex]?.id ?? null,
  };
}

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
  }, [item.id, item.mediaUrl, shouldPlay]);

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

  return <Image src={previewUrl} alt="" fill sizes={sizes} unoptimized />;
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
        <p className={styles.eyebrow}>Conteúdo da Arena</p>
        <h3>Reels da Arena</h3>
        <p>Veja os Reels com os treinos, eventos e bastidores da Arena.</p>
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
        <p className={styles.eyebrow}>Em tempo real</p>
        <h3>Stories da Arena</h3>
        <p>
          Acompanhe os Stories da Arena e fique por dentro do que está ocorrendo
          em tempo real.
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
  const storySwipeRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  const suppressStoryClickRef = useRef(false);
  const suppressStoryClickTimerRef = useRef<number | null>(null);
  const refreshControllerRef = useRef<AbortController | null>(null);
  const refreshInFlightRef = useRef(false);
  const lastStoriesRefreshStartedAtRef = useRef(0);
  const latestStoriesFetchedAtRef = useRef(
    getInstagramStoriesSnapshotTimestamp(feed.storiesFetchedAt),
  );
  const [liveStories, dispatchLiveStories] = useReducer(
    liveStoriesReducer,
    feed,
    createLiveStoriesState,
  );
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);

  const reels = feed.reels;
  const feedStoriesFetchedAt = getInstagramStoriesSnapshotTimestamp(
    feed.storiesFetchedAt,
  );
  const liveStoriesFetchedAt = getInstagramStoriesSnapshotTimestamp(
    liveStories.fetchedAt,
  );
  const shouldUseFeedStories = feedStoriesFetchedAt > liveStoriesFetchedAt;
  const stories = shouldUseFeedStories ? feed.stories : liveStories.stories;
  const storiesStatus = shouldUseFeedStories ? feed.status : liveStories.status;
  const selectedStoryIndex = stories.findIndex(
    (story) => story.id === liveStories.activeStoryId,
  );
  const normalizedStoryIndex = selectedStoryIndex >= 0 ? selectedStoryIndex : 0;
  const activeStory = stories[normalizedStoryIndex] ?? null;
  const hasLiveMedia =
    storiesStatus === "connected" && (stories.length > 0 || reels.length > 0);

  useEffect(() => {
    lastStoriesRefreshStartedAtRef.current =
      feed.status === "connected" ? Date.now() : 0;
    latestStoriesFetchedAtRef.current = Math.max(
      latestStoriesFetchedAtRef.current,
      getInstagramStoriesSnapshotTimestamp(feed.storiesFetchedAt),
    );
  }, [feed.status, feed.storiesFetchedAt]);

  const refreshStories = useCallback(async () => {
    const now = Date.now();
    if (
      refreshInFlightRef.current ||
      now - lastStoriesRefreshStartedAtRef.current <
        INSTAGRAM_STORIES_MIN_REFRESH_MS
    ) {
      return;
    }

    const controller = new AbortController();
    refreshControllerRef.current = controller;
    refreshInFlightRef.current = true;
    lastStoriesRefreshStartedAtRef.current = now;
    const timeout = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch("/api/instagram/stories", {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        return;
      }

      const snapshot: unknown = await response.json();
      if (
        !isInstagramStoriesSnapshot(snapshot) ||
        snapshot.status !== "connected"
      ) {
        return;
      }

      const snapshotFetchedAt = getInstagramStoriesSnapshotTimestamp(
        snapshot.fetchedAt,
      );
      if (
        snapshotFetchedAt <= 0 ||
        snapshotFetchedAt <= latestStoriesFetchedAtRef.current
      ) {
        return;
      }

      latestStoriesFetchedAtRef.current = snapshotFetchedAt;
      dispatchLiveStories({ type: "replace", snapshot });
    } catch {
      if (
        controller.signal.aborted &&
        refreshControllerRef.current === controller
      ) {
        lastStoriesRefreshStartedAtRef.current = 0;
      }
      // Keep the last valid Stories visible after a transient failure.
    } finally {
      window.clearTimeout(timeout);
      if (refreshControllerRef.current === controller) {
        refreshControllerRef.current = null;
        refreshInFlightRef.current = false;
      }
    }
  }, []);

  useEffect(
    () => () => {
      if (suppressStoryClickTimerRef.current !== null) {
        window.clearTimeout(suppressStoryClickTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setMotionAllowed(!mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () =>
      mediaQuery.removeEventListener("change", updateMotionPreference);
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
    if (!isVisible || !pageVisible) {
      const controller = refreshControllerRef.current;
      controller?.abort();
      if (refreshControllerRef.current === controller) {
        refreshControllerRef.current = null;
        refreshInFlightRef.current = false;
      }
      return;
    }

    let interval: number | null = null;
    const kickoffDelay = getInstagramStoriesRefreshDelay(
      lastStoriesRefreshStartedAtRef.current,
      Date.now(),
    );
    const kickoff = window.setTimeout(() => {
      void refreshStories();
      interval = window.setInterval(
        () => void refreshStories(),
        INSTAGRAM_STORIES_REFRESH_MS,
      );
    }, kickoffDelay);

    return () => {
      window.clearTimeout(kickoff);
      if (interval !== null) {
        window.clearInterval(interval);
      }
      const controller = refreshControllerRef.current;
      controller?.abort();
      if (refreshControllerRef.current === controller) {
        refreshControllerRef.current = null;
        refreshInFlightRef.current = false;
      }
    };
  }, [isVisible, pageVisible, refreshStories]);

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
      dispatchLiveStories({ type: "advance", stories });
    }, STORY_ROTATION_MS);

    return () => window.clearInterval(interval);
  }, [
    interactionPaused,
    isVisible,
    manualPaused,
    motionAllowed,
    pageVisible,
    stories,
    stories.length,
  ]);

  const visibleReels = reels.slice(0, 4);
  const shouldPlayActiveStory =
    motionAllowed &&
    isVisible &&
    pageVisible &&
    !interactionPaused &&
    !manualPaused;

  const navigateStory = (direction: "previous" | "next") => {
    dispatchLiveStories({
      type: "navigate",
      direction,
      stories,
    });
  };

  const handleStoryKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.target !== event.currentTarget || stories.length < 2) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateStory("previous");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateStory("next");
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const story =
        event.key === "Home" ? stories[0] : stories[stories.length - 1];
      if (story) {
        dispatchLiveStories({ type: "select", storyId: story.id });
      }
    }
  };

  const handleStoryPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (event.pointerType === "mouse" || !event.isPrimary || stories.length < 2) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("a, button, [role='button']")
    ) {
      return;
    }

    storySwipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    setInteractionPaused(true);
  };

  const handleStoryPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const swipe = storySwipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    const distanceX = event.clientX - swipe.startX;
    const distanceY = event.clientY - swipe.startY;
    if (Math.abs(distanceX) > 10 && Math.abs(distanceX) > Math.abs(distanceY)) {
      event.preventDefault();
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
  };

  const finishStorySwipe = (
    event: ReactPointerEvent<HTMLDivElement>,
    cancelled = false,
  ) => {
    const swipe = storySwipeRef.current;
    if (!swipe || swipe.pointerId !== event.pointerId) {
      return;
    }

    storySwipeRef.current = null;
    setInteractionPaused(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (cancelled) {
      return;
    }

    const distanceX = event.clientX - swipe.startX;
    const distanceY = event.clientY - swipe.startY;
    const direction = getStorySwipeDirection(distanceX, distanceY);
    if (!direction) {
      return;
    }

    suppressStoryClickRef.current = true;
    if (suppressStoryClickTimerRef.current !== null) {
      window.clearTimeout(suppressStoryClickTimerRef.current);
    }
    suppressStoryClickTimerRef.current = window.setTimeout(() => {
      suppressStoryClickRef.current = false;
      suppressStoryClickTimerRef.current = null;
    }, 300);
    navigateStory(direction);
  };

  return (
    <div ref={rootRef} className={styles.syncBoundary}>
      {!hasLiveMedia ? (
        <InstagramProfileFallback />
      ) : (
        <div
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
                <p className={styles.eyebrow}>Em tempo real</p>
                <h3>Stories da Arena</h3>
                <p className={styles.panelDescription}>
                  Acompanhe os Stories da Arena e fique por dentro do que está
                  ocorrendo em tempo real.
                </p>
              </div>
              {stories.length > 1 ? (
                <div className={styles.storyStatus}>
                  <span
                    aria-label={`Story ${normalizedStoryIndex + 1} de ${stories.length}`}
                  >
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
                <div
                  className={styles.storyStage}
                  role="group"
                  aria-roledescription="carrossel"
                  aria-label={
                    stories.length > 1
                      ? `Story ${normalizedStoryIndex + 1} de ${stories.length}. Arraste para os lados ou use as setas do teclado para navegar.`
                      : "Story da Arena Sul"
                  }
                  data-swipeable={stories.length > 1 ? "true" : undefined}
                  tabIndex={stories.length > 1 ? 0 : undefined}
                  onKeyDown={handleStoryKeyDown}
                  onPointerDown={handleStoryPointerDown}
                  onPointerMove={handleStoryPointerMove}
                  onPointerUp={(event) => finishStorySwipe(event)}
                  onPointerCancel={(event) => finishStorySwipe(event, true)}
                  onClickCapture={(event) => {
                    if (suppressStoryClickRef.current) {
                      event.preventDefault();
                      event.stopPropagation();
                      suppressStoryClickRef.current = false;
                    }
                  }}
                  onDragStart={(event) => event.preventDefault()}
                >
                  <MediaVisual
                    item={activeStory}
                    sizes="(max-width: 760px) 88vw, 360px"
                    shouldAutoPlay={shouldPlayActiveStory}
                    videoControls
                  />
                  {stories.length > 1 ? (
                    <div
                      className={styles.storyNavigation}
                      role="group"
                      aria-label="Navegação dos Stories"
                    >
                      <button
                        className={styles.storyArrow}
                        type="button"
                        aria-label="Ver o Story anterior"
                        onClick={() => navigateStory("previous")}
                      >
                        <span aria-hidden="true">←</span>
                      </button>
                      <button
                        className={styles.storyArrow}
                        type="button"
                        aria-label="Ver o próximo Story"
                        onClick={() => navigateStory("next")}
                      >
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  ) : null}
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
                  <p className={styles.storySwipeHint} aria-hidden="true">
                    <span>←</span> Arraste para os lados <span>→</span>
                  </p>
                ) : null}

                {stories.length > 1 ? (
                  <div
                    className={styles.storyControls}
                    aria-label="Escolher Story"
                  >
                    {stories.map((story, index) => (
                      <button
                        key={story.id}
                        type="button"
                        aria-label={`Mostrar Story ${index + 1}`}
                        aria-current={
                          index === normalizedStoryIndex ? "true" : undefined
                        }
                        onClick={() =>
                          dispatchLiveStories({
                            type: "select",
                            storyId: story.id,
                          })
                        }
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
                <a
                  href={INSTAGRAM_STORIES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir Stories <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>

          <div className={styles.reelsColumn}>
            <div className={styles.panelHeading}>
              <div>
                <p className={styles.eyebrow}>Treinos e bastidores</p>
                <h3>Reels da Arena</h3>
                <p className={styles.panelDescription}>
                  Veja os Reels com os treinos, eventos e bastidores da Arena.
                </p>
              </div>
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                      <span className={styles.playIcon} aria-hidden="true">
                        ▶
                      </span>
                    </span>
                    <span className={styles.reelMeta}>
                      <span>
                        {instagramDateFormatter.format(
                          new Date(reel.timestamp),
                        )}
                      </span>
                      <strong>
                        {reel.caption || "Novo Reel da Arena Sul"}
                      </strong>
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className={styles.noReels}>
                <p>
                  Os próximos Reels publicados aparecerão aqui automaticamente.
                </p>
                <a
                  href={INSTAGRAM_PROFILE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir @arenasulsports <span aria-hidden="true">↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
