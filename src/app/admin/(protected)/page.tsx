import Image from "next/image";
import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { getAdminEvents } from "@/lib/events/queries";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function AdminDashboardPage() {
  const events = await getAdminEvents();
  const publishedCount = events.filter(({ status }) => status === "published").length;
  const photoCount = events.reduce((sum, event) => sum + event.photos.length, 0);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Conteúdo do portal</p>
          <h1 className={styles.title}>Eventos</h1>
          <p className={styles.subtitle}>
            Cadastre acontecimentos, organize as galerias e escolha quando cada evento aparece no site.
          </p>
        </div>
        <Link className={styles.primaryButton} href="/admin/eventos/novo">
          + Criar evento
        </Link>
      </header>

      <section className={styles.statsGrid} aria-label="Resumo do conteúdo">
        <article className={styles.statCard}>
          <span>Total de eventos</span>
          <strong>{events.length}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Publicados</span>
          <strong>{publishedCount}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Fotos no portal</span>
          <strong>{photoCount}</strong>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Todos os eventos</h2>
          <span className={styles.eventDate}>Atualizados recentemente</span>
        </div>

        {events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhum evento cadastrado ainda.</p>
            <Link className={styles.primaryButton} href="/admin/eventos/novo">
              Criar o primeiro evento
            </Link>
          </div>
        ) : (
          <div className={styles.eventList}>
            {events.map((event) => (
              <article className={styles.eventRow} key={event.id}>
                <div className={styles.eventThumb}>
                  {event.coverPhoto ? (
                    <Image
                      src={event.coverPhoto.url}
                      alt={event.coverPhoto.altText || event.title}
                      fill
                      sizes="100px"
                      unoptimized
                    />
                  ) : null}
                </div>
                <div className={styles.eventInfo}>
                  <strong>{event.title}</strong>
                  <span>{event.photos.length} foto{event.photos.length === 1 ? "" : "s"}</span>
                </div>
                <time className={styles.eventDate} dateTime={event.startsAt}>
                  {dateFormatter.format(new Date(event.startsAt))}
                </time>
                <div>
                  <span
                    className={`${styles.badge} ${
                      event.status === "published" ? styles.published : styles.draft
                    }`}
                  >
                    {event.status === "published" ? "Publicado" : "Rascunho"}
                  </span>
                  <div className={styles.eventActions}>
                    <Link
                      className={styles.secondaryButton}
                      href={`/admin/eventos/${event.id}/editar`}
                    >
                      Editar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
