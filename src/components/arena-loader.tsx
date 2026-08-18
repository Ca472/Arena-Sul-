import Image from "next/image";
import styles from "./arena-loader.module.css";

export function ArenaLoader() {
  return (
    <div className={styles.loader}>
      <div className={styles.stage} aria-hidden="true">
        <span className={styles.ambientGlow} />
        <span className={styles.courtPlane} />
        <span className={styles.horizonLine} />
        <span className={styles.racketTrail} />
        <span className={styles.racketRig}>
          <Image
            className={styles.racketImage}
            src="/images/intro/arena-racket-realistic.png"
            alt=""
            width={1024}
            height={1536}
            sizes="(min-width: 2400px) 900px, (max-width: 520px) 58vw, (max-height: 520px) 34vw, 430px"
            loading="eager"
            fetchPriority="high"
            data-intro-asset
          />
        </span>
        <span className={styles.ballTrail} />
        <span className={styles.ballRig}>
          <Image
            className={styles.ballImage}
            src="/images/intro/arena-ball-realistic.png"
            alt=""
            width={1254}
            height={1254}
            sizes="(min-width: 2400px) 128px, (max-width: 520px) 16vw, (max-height: 520px) 8vw, 86px"
            loading="eager"
            data-intro-asset
          />
        </span>
        <span className={styles.impactFlash} />
        <span className={styles.impactRing} />
        <span className={styles.impactParticles}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} />
          ))}
        </span>
        <span className={styles.brandLockup}>
          <span className={styles.logoHalo} />
          <Image
            className={styles.logo}
            src="/images/arena-sul-logo-white.png"
            alt=""
            width={225}
            height={225}
            sizes="(min-width: 2400px) 360px, (max-width: 480px) 174px, (max-height: 520px) 132px, 220px"
            loading="eager"
            data-intro-asset
          />
        </span>
      </div>
      <div className={styles.signature} aria-hidden="true">
        <p className={styles.statusEyebrow}>Arena Sul Sports</p>
        <p className={styles.statusText}>Esporte. Conexão. Experiência.</p>
      </div>
    </div>
  );
}
