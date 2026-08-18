import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { getPublishedEvents } from "@/lib/events/queries";

import styles from "./events.module.css";

export const metadata: Metadata = {
  title: "Eventos",
  description:
    "Conheça campeonatos, encontros e experiências realizados na Arena Sul Sports, em São José dos Campos.",
  alternates: { canonical: "/eventos" },
  openGraph: {
    title: "Eventos da Arena Sul Sports",
    description:
      "Esporte, convivência e experiências que ganham vida nas quadras da Arena Sul.",
    url: "/eventos",
    images: [
      {
        url: "/images/arena-sul-og-background.jpg",
        width: 1728,
        height: 912,
        alt: "Esportes de areia na identidade da Arena Sul Sports",
      },
    ],
  },
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function EventsPage() {
  const events = await getPublishedEvents({ limit: 100 });

  return (
    <main className={`public-site ${styles.page}`}>
      <div className={styles.header}>
        <SiteHeader />
      </div>

      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Galeria da Arena</p>
          <h1>Eventos que ganham vida.</h1>
          <p>
            Campeonatos, encontros, experiências corporativas e dias que ficam
            registrados dentro e fora das quadras.
          </p>
        </div>
      </section>

      <section className={styles.listing} aria-labelledby="event-list-title">
        <div className={`shell ${styles.listingIntro}`}>
          <h2 id="event-list-title">A Arena em movimento</h2>
          <p>
            Confira campeonatos, encontros e experiências realizadas na Arena
            Sul.
          </p>
        </div>

        {events.length > 0 ? (
          <div className={`shell ${styles.grid}`}>
            {events.map((event) => (
              <article className={styles.card} key={event.id}>
                <Link
                  className={styles.cardImage}
                  href={`/eventos/${event.slug}`}
                  aria-label={`Abrir ${event.title}`}
                >
                  <Image
                    src={event.coverPhoto?.url ?? "/images/events-banner.webp"}
                    alt={
                      event.coverPhoto?.altText ||
                      `Capa do evento ${event.title}`
                    }
                    fill
                    sizes="(max-width: 650px) 100vw, (max-width: 920px) 50vw, 33vw"
                  />
                </Link>
                <div className={styles.cardBody}>
                  <time className={styles.cardDate} dateTime={event.startsAt}>
                    {dateFormatter.format(new Date(event.startsAt))}
                  </time>
                  <h2>{event.title}</h2>
                  {event.excerpt ? <p>{event.excerpt}</p> : null}
                  <Link
                    className={styles.cardLink}
                    href={`/eventos/${event.slug}`}
                  >
                    Ver evento <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={`shell ${styles.empty}`}>
            <p>Novos eventos serão publicados aqui em breve.</p>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <div className={`shell ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} Arena Sul Sports</span>
          <div className={styles.footerLinks}>
            <Link href="/">Início</Link>
            <a
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <Link href="/admin">Área administrativa</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
