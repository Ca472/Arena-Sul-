import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublishedEvents } from "@/lib/events/queries";

const stats = [
  { value: "13", label: "quadras de areia" },
  { value: "1", label: "campo society" },
];

const amenities = [
  "13 quadras de areia",
  "Campo de futebol society",
  "Área de convivência",
  "Espaço para aulas e treinos",
  "Estrutura para grupos e eventos",
];

const modalities = [
  {
    title: "Beach Tennis",
    image: "/images/racket-woman.webp",
    alt: "Atleta praticando beach tennis na areia",
    text: "Aulas, jogos e torneios para diferentes níveis.",
  },
  {
    title: "Futevôlei",
    image: "/images/footvolley-case.webp",
    alt: "Atleta praticando futevôlei na Arena Sul",
    text: "Treinos, partidas e uma comunidade que vive o esporte.",
  },
  {
    title: "Vôlei de areia",
    image: "/images/sand-sport-action.webp",
    alt: "Atleta saltando para jogar vôlei de areia",
    text: "Aulas e jogos para diferentes níveis.",
  },
  {
    title: "Futebol Society",
    image: "/images/courts-detail.webp",
    alt: "Campo e quadras da Arena Sul Sports",
    text: "Partidas, campeonatos e confraternizações.",
  },
  {
    title: "Funcional",
    image: "/images/group-class.webp",
    alt: "Turma em atividade esportiva coletiva na Arena Sul",
    text: "Treinos coletivos ao ar livre.",
  },
];

const eventTypes = [
  "Campeonatos",
  "Eventos corporativos",
  "Eventos escolares",
  "Confraternizações",
];

const contactUrl =
  "https://wa.me/551233071093?text=Ol%C3%A1%2C%20quero%20conhecer%20as%20op%C3%A7%C3%B5es%20da%20Arena%20Sul.";

const arenaLocation =
  "Arena Sul Sports, Rua Maurício Cardoso, 220, Jardim Sul, São José dos Campos, SP, 12236-495, Brasil";
const arenaGooglePlaceId = "ChIJkWB_KrNKzJQR-wIxev1IPvc";
const mapsPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arenaLocation)}&query_place_id=${arenaGooglePlaceId}`;
const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(arenaLocation)}&destination_place_id=${arenaGooglePlaceId}`;
const mapsEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3665.7724281961564!2d-45.892190899999996!3d-23.251366899999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cc4ab32a7f6091%3A0xf73e48fd7a3102fb!2sArena%20Sul%20Sports!5e0!3m2!1spt-BR!2sbr!4v1787057333290!5m2!1spt-BR!2sbr";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Arena Sul Sports",
  url: "https://www.arenasulsports.com/",
  telephone: "+55 12 3307-1093",
  image: "https://www.arenasulsports.com/images/arena-courts.webp",
  description:
    "Arena esportiva e espaço para eventos em São José dos Campos, com quadras de areia, campo society e área de convivência.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Rua Maurício Cardoso, 220",
    addressLocality: "São José dos Campos",
    addressRegion: "SP",
    postalCode: "12236-495",
    addressCountry: "BR",
  },
  sameAs: [
    "https://www.instagram.com/arenasulsports/",
    "https://linktr.ee/arenasulsports",
  ],
  hasMap: mapsPlaceUrl,
};

const eventDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export default async function Home() {
  const publishedEvents = await getPublishedEvents({ limit: 3 });

  return (
    <main className="public-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <section className="hero" id="inicio">
        <SiteHeader />

        <div className="hero-grid shell">
          <div className="hero-copy">
            <p className="eyebrow">São José dos Campos · SP</p>
            <h1 className="hero-title">
              O esporte encontra pessoas. <span>Eventos ganham vida.</span>
            </h1>
            <p className="hero-lead">
              Um espaço para esporte, encontros e eventos em São José dos
              Campos.
            </p>
            <div className="hero-actions">
              <a
                className="button button-primary"
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
              >
                Falar com a Arena
              </a>
              <a className="button button-ghost" href="#estrutura">
                Conhecer a estrutura
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-sun" />
            <div className="hero-slash hero-slash-one" />
            <div className="hero-slash hero-slash-two" />
            <Image
              className="athlete athlete-racket"
              src="/images/athlete-racket.webp"
              alt=""
              width={1937}
              height={1291}
              sizes="(max-width: 600px) 100vw, (max-width: 850px) 55vw, (max-width: 1100px) 35vw, 40vw"
              priority
            />
            <Image
              className="athlete athlete-volleyball"
              src="/images/athlete-volleyball.webp"
              alt=""
              width={1291}
              height={1936}
              sizes="(max-width: 600px) 95vw, (max-width: 850px) 48vw, (max-width: 1100px) 32vw, 35vw"
              priority
            />
            <p className="visual-note">Esporte. Conexão. Experiência.</p>
          </div>
        </div>

        <div className="stats shell" role="group" aria-label="Números da Arena Sul">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about section" id="arena">
        <div className="about-grid shell">
          <div className="about-media">
            <Image
              src="/images/arena-courts.webp"
              alt="Panorama das quadras de areia da Arena Sul Sports"
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
            />
            <div className="about-badge">
              <strong>30</strong>
              <span>anos de história no esporte da região</span>
            </div>
          </div>

          <div className="about-copy">
            <p className="section-kicker">Sobre a Arena</p>
            <h2>Mais do que uma arena, somos um ponto de encontro.</h2>
            <p>
              A Arena Sul reúne esporte, convivência e eventos em um ambiente
              acolhedor para atletas, famílias, escolas, empresas e amigos em
              São José dos Campos.
            </p>
            <a className="text-link" href="#estrutura">
              Conheça o espaço <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <section className="amenities section" id="estrutura">
        <div className="amenities-grid shell">
          <div
            className="amenities-collage"
            role="group"
            aria-label="Galeria da estrutura"
          >
            <figure className="collage-main">
              <Image
                src="/images/courts-aerial.webp"
                alt="Vista aérea das quadras da Arena Sul"
                fill
                sizes="(max-width: 900px) 100vw, 28vw"
              />
            </figure>
            <figure className="collage-secondary">
              <Image
                src="/images/event-lounge.webp"
                alt="Área de convivência preparada para um evento"
                fill
                sizes="(max-width: 900px) 50vw, 22vw"
              />
            </figure>
            <figure className="collage-tertiary">
              <Image
                src="/images/group-class.webp"
                alt="Atividade coletiva nas quadras de areia"
                fill
                sizes="(max-width: 900px) 50vw, 18vw"
              />
            </figure>
          </div>

          <div className="amenities-copy">
            <p className="section-kicker">Estrutura</p>
            <h2>Esporte e eventos em um só lugar.</h2>
            <p className="section-intro">
              Um espaço versátil para treinar, competir, reunir pessoas e
              celebrar.
            </p>
            <ul className="amenities-list">
              {amenities.map((item) => (
                <li key={item}>
                  <span aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="modalities section" id="modalidades">
        <div className="section-heading shell">
          <div>
            <p className="section-kicker">Esportes</p>
            <h2>Escolha seu esporte.</h2>
          </div>
          <div className="section-summary">
            <p>Aulas, treinos, jogos e competições para diferentes níveis.</p>
            <a
              className="text-link"
              href={contactUrl}
              target="_blank"
              rel="noreferrer"
            >
              Consultar aulas e horários <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="modality-grid shell">
          {modalities.map((modality, index) => (
            <article className="modality-card" key={modality.title}>
              <div className="modality-image">
                <Image
                  src={modality.image}
                  alt={modality.alt}
                  fill
                  sizes={
                    index === modalities.length - 1
                      ? "(max-width: 850px) 100vw, (max-width: 1100px) 33vw, 20vw"
                      : "(max-width: 850px) 50vw, (max-width: 1100px) 33vw, 20vw"
                  }
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="modality-content">
                <h3>{modality.title}</h3>
                <p>{modality.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="events" id="eventos">
        <Image
          className="events-background"
          src="/images/events-banner.webp"
          alt=""
          fill
          sizes="100vw"
        />
        <div className="events-shade" />
        <div className="events-card shell">
          <div className="events-copy">
            <p className="section-kicker light">Eventos</p>
            <h2>Seu evento acontece aqui.</h2>
            <p>
              Uma estrutura flexível para receber diferentes formatos e reunir
              pessoas dentro e fora das quadras.
            </p>
            <a
              className="button button-primary"
              href={contactUrl}
              target="_blank"
              rel="noreferrer"
            >
              Solicitar uma proposta
            </a>
          </div>
          <ul className="event-type-list">
            {eventTypes.map((type, index) => (
              <li key={type}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {type}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {publishedEvents.length > 0 ? (
        <section className="cases section" aria-labelledby="cases-title">
          <div className="section-heading shell">
            <div>
              <p className="section-kicker">Últimos eventos</p>
              <h2 id="cases-title">A Arena em movimento.</h2>
            </div>
            <p>Campeonatos, encontros e experiências vividas por aqui.</p>
          </div>
          <div className="case-grid shell">
            {publishedEvents.map((event) => (
              <Link
                className="case-card"
                href={`/eventos/${event.slug}`}
                key={event.id}
              >
                <div>
                  <Image
                    src={event.coverPhoto?.url ?? "/images/events-banner.webp"}
                    alt={
                      event.coverPhoto?.altText ||
                      `Capa do evento ${event.title}`
                    }
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <p>{eventDateFormatter.format(new Date(event.startsAt))}</p>
                <h3>{event.title}</h3>
              </Link>
            ))}
          </div>
          <div className="all-events-link shell">
            <Link className="text-link" href="/eventos">
              Ver todos os eventos <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      ) : null}

      <footer className="footer" id="contato">
        <div className="footer-instagram shell">
          <div>
            <p className="section-kicker light">No Instagram</p>
            <h2>@arenasulsports</h2>
            <p>Acompanhe campeonatos, treinos e bastidores da Arena.</p>
          </div>
          <a
            className="button button-instagram"
            href="https://www.instagram.com/stories/highlights/17901721567915380/"
            target="_blank"
            rel="noreferrer"
          >
            Ver destaque “Eventos” <span aria-hidden="true">↗</span>
          </a>
        </div>
        <section
          className="footer-location shell"
          aria-labelledby="arena-location-title"
        >
          <div className="footer-location-copy">
            <p className="section-kicker light">Onde estamos</p>
            <h2 id="arena-location-title">Venha para a Arena Sul.</h2>
            <address>
              Rua Maurício Cardoso, 220 — Jardim Sul
              <br />
              São José dos Campos — SP · 12236-495
            </address>
            <a
              className="button button-location"
              href={mapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Traçar rota no Google Maps <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="footer-map-frame">
            <iframe
              src={mapsEmbedUrl}
              title="Mapa da Arena Sul Sports em São José dos Campos"
              width="600"
              height="450"
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </section>
        <div className="footer-grid shell">
          <div className="footer-brand">
            <Image
              src="/images/arena-sul-logo-white.png"
              alt="Arena Sul Sports"
              width={225}
              height={225}
            />
            <p>Esporte. Conexão. Experiência.</p>
          </div>
          <div>
            <h2>Fale com a gente</h2>
            <a href="tel:+551233071093">(12) 3307-1093</a>
            <a href={contactUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          </div>
          <div>
            <h2>Navegue</h2>
            <a href="#arena">A Arena</a>
            <a href="#estrutura">Estrutura</a>
            <a href="#modalidades">Esportes</a>
            <a href="#eventos">Eventos</a>
          </div>
        </div>
        <div className="footer-bottom shell">
          <p>© {new Date().getFullYear()} Arena Sul Sports. Todos os direitos reservados.</p>
          <a href="/admin">Área administrativa</a>
        </div>
      </footer>
    </main>
  );
}
