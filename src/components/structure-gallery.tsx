"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SiteMediaMap, SiteMediaSlot } from "@/lib/site-media/catalog";
import styles from "./structure-gallery.module.css";

const AUTO_ROTATE_MS = 5_000;
const SWIPE_THRESHOLD_PX = 48;
const MOBILE_PORTRAIT_QUERY = "(max-width: 600px) and (orientation: portrait)";

type StructureSlide = {
  slot: SiteMediaSlot;
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  description: string;
  fit: "cover" | "contain";
  position: string;
  compactCaption?: boolean;
  mobileSrc?: string;
  mobileAlt?: string;
  mobilePosition?: string;
};

type ImageVariant = "desktop" | "mobile";

const slides: readonly StructureSlide[] = [
  {
    slot: "structure-sand-courts",
    src: "/images/estrutura-quadras-areia.jpg",
    alt: "Quadras de areia da Arena Sul com redes sob o céu azul",
    eyebrow: "Estrutura esportiva",
    title: "13 quadras de areia",
    description: "Espaço para Beach Tennis, Futevôlei e Vôlei de Praia.",
    fit: "cover",
    position: "center 57%",
  },
  {
    slot: "structure-aerial-view",
    src: "/images/estrutura-vista-aerea.jpg",
    alt: "Vista aérea das quadras e da estrutura da Arena Sul cercadas pela área verde",
    eyebrow: "Vista da Arena",
    title: "Estrutura esportiva completa",
    description:
      "Quadras e espaços preparados para diferentes modalidades e níveis.",
    fit: "contain",
    position: "center",
  },
  {
    slot: "structure-sand-classes",
    src: "/images/group-class.webp",
    alt: "Atividade coletiva em uma quadra de areia da Arena Sul",
    eyebrow: "Saúde e movimento",
    title: "Aulas de esportes de areia",
    description:
      "Treinos e atividades para aprender, evoluir e se movimentar em grupo.",
    fit: "contain",
    position: "center 42%",
  },
  {
    slot: "structure-barbecue",
    src: "/images/estrutura-churrasqueira.jpg",
    alt: "Churrasqueira coberta da Arena Sul com pia, mesas e cadeiras",
    eyebrow: "Celebre na Arena",
    title: "3 churrasqueiras",
    description: "Bons momentos em família e amigos",
    fit: "contain",
    position: "center 58%",
  },
  {
    slot: "structure-bar-kitchen",
    src: "/images/estrutura-bar-coberto.jpg",
    alt: "Área coberta do bar da Arena Sul com mesas e cadeiras",
    eyebrow: "Comodidade",
    title: "Bar e cozinha",
    description: "Bateu aquela fome, Bar e Cozinha Completos.",
    fit: "contain",
    position: "center 62%",
  },
  {
    slot: "structure-leisure",
    src: "/images/estrutura-bar-convivencia.jpg",
    alt: "Área externa de convivência do bar com vista para as quadras de areia",
    eyebrow: "Convivência",
    title: "Diversos espaços de lazer",
    description: "Com 10.000 m², a Arena comporta 500 pessoas.",
    fit: "cover",
    position: "center",
  },
  {
    slot: "structure-events",
    src: "/images/estrutura-eventos-area-lazer-v2.png",
    alt: "Vista superior da área de convivência e das quadras de areia da Arena Sul",
    eyebrow: "Estrutura completa",
    title: "Para torneios, eventos corporativos e escolares",
    description: "Conte conosco para auxiliar na organização do seu evento.",
    fit: "contain",
    position: "center",
    compactCaption: true,
  },
];

function wrapIndex(index: number) {
  return (index + slides.length) % slides.length;
}

function getImageLoadKey(index: number, variant: ImageVariant) {
  return `${index}:${variant}`;
}

export function StructureGallery({
  media,
}: {
  media?: Partial<SiteMediaMap>;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const loadedImagesRef = useRef(new Set<string>());
  const pendingIndexRef = useRef<number | null>(null);
  const pendingAnnouncementRef = useRef(false);
  const previousMobilePortraitRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const pointerStartX = useRef<number | null>(null);
  const pointerStartY = useRef<number | null>(null);
  const interactionPaused = isHovered || isFocusWithin;
  const resolvedSlides = useMemo(
    () =>
      slides.map((slide) => {
        const resolvedSrc = media?.[slide.slot] ?? slide.src;
        return resolvedSrc === slide.src
          ? slide
          : { ...slide, src: resolvedSrc, mobileSrc: undefined };
      }),
    [media],
  );
  const getVisibleImageVariant = useCallback(
    (index: number): ImageVariant =>
      resolvedSlides[index].mobileSrc &&
      window.matchMedia(MOBILE_PORTRAIT_QUERY).matches
        ? "mobile"
        : "desktop",
    [resolvedSlides],
  );

  const autoplayEnabled =
    !interactionPaused &&
    isVisible &&
    pageVisible &&
    pendingIndex === null &&
    outgoingIndex === null &&
    !prefersReducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_PORTRAIT_QUERY);
    const updateViewportVariant = () => {
      setIsMobilePortrait(mediaQuery.matches);
    };

    updateViewportVariant();
    mediaQuery.addEventListener("change", updateViewportVariant);
    return () =>
      mediaQuery.removeEventListener("change", updateViewportVariant);
  }, []);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.intersectionRatio >= 0.4),
      { threshold: 0.4 },
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

  const commitSlide = useCallback(
    (nextIndex: number, announce: boolean) => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      setOutgoingIndex(activeIndex);
      setActiveIndex(nextIndex);
      pendingIndexRef.current = null;
      setPendingIndex(null);

      transitionTimeoutRef.current = window.setTimeout(() => {
        setOutgoingIndex(null);
        transitionTimeoutRef.current = null;
      }, 740);

      if (announce) {
        setStatusMessage(
          `Foto ${nextIndex + 1} de ${slides.length}: ${slides[nextIndex].title}`,
        );
      }
    },
    [activeIndex],
  );

  const requestSlide = useCallback(
    (index: number, announce = true) => {
      const nextIndex = wrapIndex(index);

      if (nextIndex === activeIndex) {
        pendingIndexRef.current = null;
        pendingAnnouncementRef.current = false;
        setPendingIndex(null);
        setStatusMessage("");
        return;
      }

      const imageVariant = getVisibleImageVariant(nextIndex);

      const isCurrentlyRendered =
        nextIndex === wrapIndex(activeIndex - 1) ||
        nextIndex === wrapIndex(activeIndex + 1) ||
        nextIndex === outgoingIndex;

      if (
        isCurrentlyRendered &&
        loadedImagesRef.current.has(getImageLoadKey(nextIndex, imageVariant))
      ) {
        commitSlide(nextIndex, announce);
        return;
      }

      pendingAnnouncementRef.current = announce;
      pendingIndexRef.current = nextIndex;
      setPendingIndex(nextIndex);
      if (announce) {
        setStatusMessage(`Carregando foto ${nextIndex + 1}`);
      }
    },
    [activeIndex, commitSlide, getVisibleImageVariant, outgoingIndex],
  );

  useEffect(() => {
    if (!autoplayEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      requestSlide(activeIndex + 1, false);
    }, AUTO_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [activeIndex, autoplayEnabled, requestSlide]);

  const handleImageLoaded = (index: number, variant: ImageVariant) => {
    const visibleVariant = getVisibleImageVariant(index);

    if (variant !== visibleVariant) {
      return;
    }

    loadedImagesRef.current.add(getImageLoadKey(index, variant));

    if (pendingIndexRef.current === index) {
      commitSlide(index, pendingAnnouncementRef.current);
    }
  };

  useEffect(() => {
    if (previousMobilePortraitRef.current === isMobilePortrait) {
      return;
    }
    previousMobilePortraitRef.current = isMobilePortrait;

    const requestedIndex = pendingIndexRef.current;
    if (requestedIndex === null) {
      return;
    }

    const visibleVariant = getVisibleImageVariant(requestedIndex);

    if (
      loadedImagesRef.current.has(
        getImageLoadKey(requestedIndex, visibleVariant),
      )
    ) {
      commitSlide(requestedIndex, pendingAnnouncementRef.current);
    }
  }, [commitSlide, getVisibleImageVariant, isMobilePortrait]);

  const showPrevious = () => requestSlide(activeIndex - 1);
  const showNext = () => requestSlide(activeIndex + 1);

  const previousIndex = wrapIndex(activeIndex - 1);
  const nextIndex = wrapIndex(activeIndex + 1);

  return (
    <section
      ref={rootRef}
      className={`${styles.gallery} shell`}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Conheça a estrutura da Arena Sul"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") {
          setIsHovered(true);
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") {
          setIsHovered(false);
        }
      }}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsFocusWithin(false);
        }
      }}
    >
      <div
        className={styles.stage}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") {
            pointerStartX.current = event.clientX;
            pointerStartY.current = event.clientY;
          }
        }}
        onPointerCancel={() => {
          pointerStartX.current = null;
          pointerStartY.current = null;
        }}
        onPointerUp={(event) => {
          if (pointerStartX.current === null || pointerStartY.current === null) {
            return;
          }

          const distanceX = event.clientX - pointerStartX.current;
          const distanceY = event.clientY - pointerStartY.current;
          pointerStartX.current = null;
          pointerStartY.current = null;

          if (
            Math.abs(distanceX) < SWIPE_THRESHOLD_PX ||
            Math.abs(distanceX) <= Math.abs(distanceY) * 1.2
          ) {
            return;
          }

          if (distanceX > 0) {
            showPrevious();
          } else {
            showNext();
          }
        }}
      >
        {resolvedSlides.map((slide, index) => {
          const isActive = index === activeIndex;
          const desktopSizes = slide.mobileSrc
            ? "(max-width: 600px) and (orientation: portrait) 1px, (max-width: 1220px) calc(100vw - 40px), (max-width: 1599px) 1180px, 1320px"
            : "(max-width: 600px) calc(100vw - 28px), (max-width: 1220px) calc(100vw - 40px), (max-width: 1599px) 1180px, 1320px";
          const shouldRenderImage =
            isActive ||
            index === previousIndex ||
            index === nextIndex ||
            index === outgoingIndex ||
            index === pendingIndex;

          return (
            <figure
              className={styles.slide}
              data-active={isActive}
              data-fit={slide.fit}
              data-compact-caption={slide.compactCaption || undefined}
              data-mobile-image={Boolean(slide.mobileSrc)}
              role="group"
              aria-roledescription="slide"
              aria-label={`Foto ${index + 1} de ${slides.length}: ${slide.title}`}
              aria-hidden={!isActive}
              key={slide.slot}
            >
              {shouldRenderImage ? (
                <>
                  {slide.fit === "contain" ? (
                    <Image
                      className={styles.backdrop}
                      src={slide.src}
                      alt=""
                      fill
                      sizes={desktopSizes}
                      aria-hidden="true"
                    />
                  ) : null}
                  <Image
                    className={`${styles.image} ${slide.mobileSrc ? styles.desktopImage : ""}`}
                    src={slide.src}
                    alt={isActive ? slide.alt : ""}
                    fill
                    sizes={desktopSizes}
                    style={{ objectPosition: slide.position }}
                    onLoad={() => handleImageLoaded(index, "desktop")}
                  />
                  {slide.mobileSrc ? (
                    <Image
                      className={`${styles.image} ${styles.mobileImage}`}
                      src={slide.mobileSrc}
                      alt={isActive ? (slide.mobileAlt ?? slide.alt) : ""}
                      fill
                      sizes="(max-width: 600px) and (orientation: portrait) calc(100vw - 28px), 1px"
                      style={{
                        objectPosition: slide.mobilePosition ?? "center",
                      }}
                      onLoad={() => handleImageLoaded(index, "mobile")}
                    />
                  ) : null}
                </>
              ) : null}
              <figcaption className={styles.caption}>
                <span>{slide.eyebrow}</span>
                <h3>{slide.title}</h3>
                <p>{slide.description}</p>
              </figcaption>
            </figure>
          );
        })}

        <span className={styles.counter} aria-hidden="true">
          {String(activeIndex + 1).padStart(2, "0")} /{" "}
          {String(slides.length).padStart(2, "0")}
        </span>

        <div
          className={styles.arrowControls}
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerCancel={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Mostrar foto anterior"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Mostrar próxima foto"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        {autoplayEnabled ? (
          <span className={styles.progressTrack} aria-hidden="true">
            <span
              className={styles.progressFill}
              key={`progress-${activeIndex}`}
            />
          </span>
        ) : null}
      </div>

      <div className={styles.controls}>
        <div
          className={styles.pagination}
          role="group"
          aria-label="Escolher uma foto"
        >
          {resolvedSlides.map((slide, index) => (
            <button
              type="button"
              className={styles.dot}
              data-active={index === activeIndex}
              aria-label={`Mostrar foto ${index + 1}: ${slide.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => requestSlide(index)}
              key={slide.slot}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <p className={styles.status} aria-live="polite" aria-atomic="true">
        {statusMessage}
      </p>
    </section>
  );
}
