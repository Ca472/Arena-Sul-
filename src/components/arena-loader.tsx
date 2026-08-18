import Image from "next/image";
import { ArenaLoaderSound } from "./arena-loader-sound";
import styles from "./arena-loader.module.css";

export function ArenaLoader() {
  return (
    <div className={styles.loader} data-arena-loader>
      <div
        className={styles.animation}
        data-arena-loader-scene
        aria-hidden="true"
      >
        <span className={styles.courtGlow} />
        <span className={styles.courtLine} />
        <span className={styles.speedTrail}>
          <span />
          <span />
          <span />
        </span>
        <span className={styles.racket}>
          <span className={styles.racketHead} />
          <span className={styles.racketHandle} />
        </span>
        <span className={styles.ball} />
        <span className={styles.impactRing} />
        <span className={styles.impactSpark}>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className={styles.logoHalo} />
        <span className={styles.logoBadge}>
          <Image
            className={styles.logo}
            src="/images/arena-sul-logo.png"
            alt=""
            width={225}
            height={225}
            sizes="(max-width: 480px) 118px, 136px"
            loading="eager"
          />
        </span>
      </div>
      <div
        className={styles.status}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className={styles.statusEyebrow}>Arena Sul Sports</p>
        <p className={styles.statusText}>Preparando a arena...</p>
      </div>
      <ArenaLoaderSound />
    </div>
  );
}
