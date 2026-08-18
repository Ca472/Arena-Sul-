import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { WhatsAppLabel } from "@/components/whatsapp-label";
import { buildWhatsAppUrl } from "@/lib/config/whatsapp";
import { getPublishedEventBySlug } from "@/lib/events/queries";

import styles from "../events.module.css";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

function eventDateLabel(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt);
  const date = dateFormatter.format(start);
  const startTime = timeFormatter.format(start);

  if (!endsAt) {
    return `${date}, às ${startTime}`;
  }

  const end = new Date(endsAt);
  const sameDay = dateFormatter.format(end) === date;

  return sameDay
    ? `${date}, das ${startTime} às ${timeFormatter.format(end)}`
    : `${date}, ${startTime} — ${dateFormatter.format(end)}, ${timeFormatter.format(end)}`;
}

export async function generateMetadata({
  params,
}: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    return { title: "Evento não encontrado" };
  }

  const description =
    event.excerpt ??
    `Veja fotos e informações de ${event.title}, na Arena Sul Sports.`;
  const socialImage = event.coverPhoto?.url ?? "/images/arena-sul-og-background.jpg";
  const socialAlt =
    event.coverPhoto?.altText || `Capa do evento ${event.title}`;

  return {
    title: event.title,
    description,
    alternates: { canonical: `/eventos/${event.slug}` },
    openGraph: {
      type: "article",
      title: event.title,
      description,
      url: `/eventos/${event.slug}`,
      publishedTime: event.publishedAt ?? undefined,
      modifiedTime: event.updatedAt,
      images: [{ url: socialImage, alt: socialAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: [socialImage],
    },
  };
}

export default async function EventDetailPage({
  params,
}: PageProps<"/eventos/[slug]">) {
  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const contactUrl = buildWhatsAppUrl(
    `Olá, Arena Sul! Gostaria de saber mais sobre o evento “${event.title}”. Poderiam me enviar as informações?`,
  );

  return (
    <main className={`public-site ${styles.page}`}>
      <div className={styles.header}>
        <SiteHeader />
      </div>

      <section className={styles.detailHero}>
        <Image
          className={styles.detailHeroImage}
          src={event.coverPhoto?.url ?? "/images/events-banner.webp"}
          alt=""
          fill
          priority
          sizes="100vw"
        />
        <div className={styles.detailHeroShade} />
        <div className={`shell ${styles.detailHeroInner}`}>
          <Link className={styles.backLink} href="/eventos">
            ← Todos os eventos
          </Link>
          <p className={styles.detailEyebrow}>Arena Sul Sports</p>
          <h1>{event.title}</h1>
          <div className={styles.detailMeta}>
            <time dateTime={event.startsAt}>
              {eventDateLabel(event.startsAt, event.endsAt)}
            </time>
            {event.location ? <span>{event.location}</span> : null}
          </div>
        </div>
      </section>

      <article className={`shell ${styles.story}`}>
        <div>
          <p className={styles.eyebrow}>Sobre o evento</p>
          <h2>Um momento para viver e lembrar.</h2>
        </div>
        <div className={styles.storyCopy}>
          <p>{event.description}</p>
        </div>
      </article>

      {event.photos.length > 0 ? (
        <section className={styles.gallerySection} aria-labelledby="gallery-title">
          <div className={`shell ${styles.galleryHeading}`}>
            <p className={styles.eyebrow}>Galeria</p>
            <h2 id="gallery-title">Registros do evento</h2>
          </div>
          <div className={`shell ${styles.gallery}`}>
            {event.photos.map((photo) => (
              <figure className={styles.galleryItem} key={photo.id}>
                <Image
                  src={photo.url}
                  alt={photo.altText || `Registro de ${event.title}`}
                  fill
                  sizes="(max-width: 920px) 100vw, 50vw"
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className={`shell ${styles.cta}`}>
        <div>
          <p className={styles.eyebrow}>Sua ideia, nossa estrutura</p>
          <h2>Quer realizar um evento aqui?</h2>
          <p>
            Converse com a equipe da Arena Sul e planeje eventos corporativos,
            eventos escolares, confraternizações, festas ou encontros.
          </p>
        </div>
        <a
          className={`${styles.button} whatsapp-cta`}
          href={contactUrl}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppLabel />
        </a>
      </section>

      <footer className={styles.footer}>
        <div className={`shell ${styles.footerInner}`}>
          <span>© {new Date().getFullYear()} Arena Sul Sports</span>
          <div className={styles.footerLinks}>
            <Link href="/">Início</Link>
            <Link href="/eventos">Eventos</Link>
            <a
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
