import Image from "next/image";

import { deletePhotoAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import type { EventPhoto } from "@/lib/events/types";

type PhotoManagerProps = {
  eventId: string;
  photos: EventPhoto[];
  demoMode: boolean;
};

export function PhotoManager({ eventId, photos, demoMode }: PhotoManagerProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <section className={`${styles.formSection} ${styles.gallerySection}`}>
      <div>
        <p className={styles.eyebrow}>Galeria atual</p>
        <h2>Fotos já salvas</h2>
      </div>
      {demoMode ? (
        <div className={styles.notice}>
          As fotos de exemplo são somente leitura e não podem ser removidas.
        </div>
      ) : null}
      <div className={styles.photoGrid}>
        {photos.map((photo) => (
          <article className={styles.photoCard} key={photo.id}>
            <div className={styles.photoImage}>
              <Image
                src={photo.url}
                alt={photo.altText}
                fill
                sizes="(max-width: 680px) 50vw, 280px"
                unoptimized
              />
            </div>
            <div className={styles.photoMeta}>
              <strong>{photo.originalName}</strong>
              <span>{photo.altText}</span>
              {!demoMode && photo.storagePath ? (
                <form action={deletePhotoAction}>
                  <input name="photoId" type="hidden" value={photo.id} />
                  <input name="eventId" type="hidden" value={eventId} />
                  <button className={styles.dangerButton} type="submit">
                    Remover foto
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
