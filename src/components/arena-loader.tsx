import Image from "next/image";
import styles from "./arena-loader.module.css";

export function ArenaLoader() {
  return (
    <div
      className={styles.loader}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Carregando Arena Sul Sports"
    >
      <div className={styles.animation} aria-hidden="true">
        <span className={styles.racket}>
          <span className={styles.racketHead} />
          <span className={styles.racketHandle} />
        </span>
        <span className={styles.ball} />
        <span className={styles.impact} />
        <span className={styles.logoBadge}>
          <Image
            className={styles.logo}
            src="/images/arena-sul-logo.png"
            alt=""
            width={225}
            height={225}
            sizes="84px"
            loading="eager"
          />
        </span>
      </div>
      <p>Preparando a arena...</p>
    </div>
  );
}
