import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { getPublishedEvents } from "@/lib/events/queries";

const stats = [
  { value: "+500", label: "pessoas em eventos" },
  { value: "13", label: "quadras de areia" },
  { value: "1", label: "campo society" },
  { value: "90–100", label: "vagas de estacionamento" },
];

const pillars = [
  {
    number: "01",
    title: "Hub de eventos",
    text: "Campeonatos, confraternizações, ativações e encontros com estrutura para receber grandes grupos.",
  },
  {
    number: "02",
    title: "Centro de treinamento",
    text: "Modalidades para diferentes níveis, conduzidas por profissionais e vividas em quadras preparadas.",
  },
  {
    number: "03",
    title: "Espaço social",
    text: "Um ambiente aberto, acolhedor e familiar para esporte, descanso, celebração e novas conexões.",
  },
];

const amenities = [
  "Quadras de areia para múltiplos esportes",
  "Campo de futebol society",
  "Iluminação em todas as quadras",
  "Sistema de som",
  "Vestiários",
  "Área de convivência ampla",
  "Espaços cobertos",
  "Mesas e guarda-sóis",
  "Área de alimentação",
  "Churrasqueiras exclusivas",
];

const modalities = [
  {
    title: "Beach Tennis",
    image: "/images/racket-woman.webp",
    alt: "Atleta praticando beach tennis na areia",
    text: "Aulas, treinos, jogos e torneios em uma estrutura preparada para todos os níveis.",
  },
  {
    title: "Futevôlei",
    image: "/images/footvolley-case.webp",
    alt: "Atleta praticando futevôlei na Arena Sul",
    text: "Técnica, intensidade e a energia de uma comunidade que vive o esporte.",
  },
  {
    title: "Vôlei de areia",
    image: "/images/sand-sport-action.webp",
    alt: "Atleta saltando para jogar vôlei de areia",
    text: "Quadras iluminadas para treinar, jogar com amigos e participar de eventos.",
  },
  {
    title: "Futebol Society",
    image: "/images/courts-detail.webp",
    alt: "Campo e quadras da Arena Sul Sports",
    text: "Campo society para partidas, horários fixos, campeonatos e confraternizações.",
  },
  {
    title: "Funcional",
    image: "/images/group-class.webp",
    alt: "Turma em atividade esportiva coletiva na Arena Sul",
    text: "Movimento orientado em um ambiente leve, amplo e conectado à vida ao ar livre.",
  },
];

const eventTypes = [
  "Campeonatos esportivos",
  "Eventos corporativos",
  "Ações promocionais",
  "Festas e encontros",
  "Eventos escolares",
];

const contactUrl =
  "https://wa.me/551233071093?text=Ol%C3%A1%2C%20quero%20conhecer%20as%20op%C3%A7%C3%B5es%20da%20Arena%20Sul.";

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
  hasMap:
    "https://www.google.com/maps/dir/?api=1&destination=R.%20Maur%C3%ADcio%20Cardoso%2C%20220%20-%20Jardim%20Sul%2C%20S%C3%A3o%20Jos%C3%A9%20dos%20Campos%20-%20SP%2C%2012236-495%2C%20Brasil",
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
              O maior espaço esportivo e de eventos do Vale do Paraíba — feito
              para jogar, celebrar e criar conexões reais.
            </p>
            <div className="hero-actions">
              <a
                className="button button-primary"
                href={contactUrl}
                target="_blank"
                rel="noreferrer"
              >
                Quero realizar um evento
              </a>
              <a className="button button-ghost" href="#estrutura">
                Conheça a estrutura
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
              priority
            />
            <Image
              className="athlete athlete-volleyball"
              src="/images/athlete-volleyball.webp"
              alt=""
              width={1291}
              height={1936}
              priority
            />
            <p className="visual-note">Esporte. Conexão. Experiência.</p>
          </div>
        </div>

        <div className="stats shell" aria-label="Números da Arena Sul">
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
              A trajetória da Arena Sul se cruza com a história das quadras de
              futebol society em São José dos Campos. Tudo começou no bairro
              Santana, com a Sand Sports, e evoluiu para um espaço pensado para
              promover saúde, convivência e boas experiências.
            </p>
            <p>
              Hoje, recebemos atletas, famílias, escolas, empresas e amigos em
              um ambiente vivo, acessível e acolhedor — com estrutura para o
              esporte e liberdade para cada evento ganhar sua própria forma.
            </p>
            <a className="text-link" href="#modalidades">
              Descubra tudo o que acontece aqui <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="pillars shell">
          {pillars.map((pillar) => (
            <article className="pillar" key={pillar.title}>
              <span>{pillar.number}</span>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="structure" id="estrutura">
        <Image
          className="structure-background"
          src="/images/arena-courts.webp"
          alt=""
          fill
          sizes="100vw"
        />
        <div className="structure-overlay" />
        <div className="structure-inner shell">
          <div className="structure-heading">
            <p className="section-kicker light">Nossa estrutura</p>
            <h2>Grande por natureza. Completa por escolha.</h2>
          </div>
          <div className="structure-numbers">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="amenities section">
        <div className="amenities-grid shell">
          <div className="amenities-collage" aria-label="Galeria da estrutura">
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
            <p className="section-kicker">Tudo no mesmo lugar</p>
            <h2>Estrutura que acompanha o ritmo do seu dia.</h2>
            <p className="section-intro">
              Da primeira partida ao encerramento do evento, cada espaço foi
              pensado para unir praticidade, conforto e movimento.
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
            <p className="section-kicker">Modalidades</p>
            <h2>Escolha seu esporte. Encontre sua turma.</h2>
          </div>
          <p>
            Aulas, locações, horários fixos, treinos e competições em um só
            endereço.
          </p>
        </div>

        <div className="modality-grid shell">
          {modalities.map((modality, index) => (
            <article className="modality-card" key={modality.title}>
              <div className="modality-image">
                <Image
                  src={modality.image}
                  alt={modality.alt}
                  fill
                  sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className="modality-content">
                <h3>{modality.title}</h3>
                <p>{modality.text}</p>
                <a href={contactUrl} target="_blank" rel="noreferrer">
                  Consultar horários <span aria-hidden="true">↗</span>
                </a>
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
            <p className="section-kicker light">Locação para eventos</p>
            <h2>Você traz a ideia. Nós entregamos a estrutura.</h2>
            <p>
              O evento pode ser organizado por você ou por parceiros. Nossa
              equipe cuida do espaço, da limpeza, da manutenção e do apoio
              operacional para tudo fluir.
            </p>
            <a
              className="button button-primary"
              href={contactUrl}
              target="_blank"
              rel="noreferrer"
            >
              Solicitar proposta
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

      <section className="process section">
        <div className="section-heading shell">
          <div>
            <p className="section-kicker">Como funciona</p>
            <h2>Da conversa ao grande dia.</h2>
          </div>
          <p>
            Flexibilidade para adequar a Arena ao formato, ao público e aos
            objetivos do seu evento.
          </p>
        </div>
        <div className="process-grid shell">
          <article>
            <span>01</span>
            <h3>Conte sua ideia</h3>
            <p>Entendemos o formato, o número de pessoas e tudo o que precisa acontecer.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Desenhamos a estrutura</h3>
            <p>Organizamos espaços, quadras, convivência e o apoio operacional necessário.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Seu evento ganha vida</h3>
            <p>Você reúne as pessoas. A Arena prepara o cenário para uma experiência memorável.</p>
          </article>
        </div>
      </section>

      <section className="partnerships section">
        <div className="partnership-grid shell">
          <article className="partnership-card schools-card">
            <Image
              src="/images/school-activity.webp"
              alt="Atividade escolar em grupo na Arena Sul"
              fill
              sizes="(max-width: 850px) 100vw, 50vw"
            />
            <div className="partnership-shade" />
            <div className="partnership-copy">
              <p>Parceria com escolas</p>
              <h2>Aprender, integrar e se movimentar.</h2>
              <ul>
                <li>Dia do estudante e interclasses</li>
                <li>Aulas externas e grandes grupos</li>
                <li>Ambiente amplo, seguro e dinâmico</li>
              </ul>
              <a href={contactUrl} target="_blank" rel="noreferrer">
                Planejar evento escolar <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>

          <article className="partnership-card companies-card">
            <Image
              src="/images/corporate-night.webp"
              alt="Integração de equipes em atividade noturna na Arena Sul"
              fill
              sizes="(max-width: 850px) 100vw, 50vw"
            />
            <div className="partnership-shade" />
            <div className="partnership-copy">
              <p>Parceria com empresas</p>
              <h2>Equipes mais próximas, experiências mais fortes.</h2>
              <ul>
                <li>Integração e eventos internos</li>
                <li>Ativações de marca</li>
                <li>Experiências corporativas</li>
              </ul>
              <a href={contactUrl} target="_blank" rel="noreferrer">
                Planejar evento corporativo <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        </div>
      </section>

      <section className="cases section" aria-labelledby="cases-title">
        <div className="section-heading shell">
          <div>
            <p className="section-kicker">A Arena em movimento</p>
            <h2 id="cases-title">Momentos que já aconteceram por aqui.</h2>
          </div>
          <p>
            Esta galeria será alimentada pelos proprietários na área
            administrativa — sem editar uma linha de código.
          </p>
        </div>
        {publishedEvents.length > 0 ? (
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
        ) : (
          <div className="empty-events shell">
            <p>Novos eventos serão publicados aqui em breve.</p>
          </div>
        )}
        <div className="all-events-link shell">
          <Link className="text-link" href="/eventos">
            Ver todos os eventos <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="manifesto">
        <div className="shell">
          <p>A Arena Sul não é só um espaço.</p>
          <h2>
            É onde o esporte encontra pessoas.
            <br />E onde eventos ganham vida.
          </h2>
        </div>
      </section>

      <section className="instagram" aria-labelledby="instagram-title">
        <div className="instagram-grid shell">
          <div className="instagram-intro">
            <p className="section-kicker light">Siga o movimento</p>
            <h2 id="instagram-title">@arenasulsports</h2>
            <p>
              Aulas, campeonatos, bastidores e tudo o que acontece nas quadras.
              Acompanhe os destaques da Arena no Instagram.
            </p>
            <a
              className="button button-instagram"
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Instagram <span aria-hidden="true">↗</span>
            </a>
            <a
              className="instagram-highlight-link"
              href="https://www.instagram.com/stories/highlights/17901721567915380/"
              target="_blank"
              rel="noreferrer"
            >
              Ver destaque “Eventos”
            </a>
          </div>
          <div className="instagram-mosaic">
            <a
              className="instagram-tile tile-large"
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir Instagram da Arena Sul"
            >
              <Image
                src="/images/tournament-podium.webp"
                alt="Torneio nas quadras da Arena Sul"
                fill
                sizes="(max-width: 760px) 66vw, 34vw"
              />
            </a>
            <a
              className="instagram-tile"
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir Instagram da Arena Sul"
            >
              <Image
                src="/images/arena-community.webp"
                alt="Comunidade reunida na Arena Sul"
                fill
                sizes="(max-width: 760px) 34vw, 17vw"
              />
            </a>
            <a
              className="instagram-tile"
              href="https://www.instagram.com/arenasulsports/"
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir Instagram da Arena Sul"
            >
              <Image
                src="/images/racket-young.webp"
                alt="Atleta com raquete na Arena Sul"
                fill
                sizes="(max-width: 760px) 34vw, 17vw"
              />
            </a>
          </div>
        </div>
      </section>

      <section className="contact" id="contato">
        <div className="contact-inner shell">
          <div>
            <p className="section-kicker">Seu próximo evento começa aqui</p>
            <h2>Vamos colocar sua ideia em movimento?</h2>
          </div>
          <a
            className="button button-contact"
            href={contactUrl}
            target="_blank"
            rel="noreferrer"
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <footer className="footer">
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
            <h2>Visite a Arena</h2>
            <address>
              Rua Maurício Cardoso, 220 — Jardim Sul<br />
              São José dos Campos — SP · 12236-495
            </address>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=R.%20Maur%C3%ADcio%20Cardoso%2C%20220%20-%20Jardim%20Sul%2C%20S%C3%A3o%20Jos%C3%A9%20dos%20Campos%20-%20SP%2C%2012236-495%2C%20Brasil"
              target="_blank"
              rel="noreferrer"
            >
              Abrir rota <span aria-hidden="true">↗</span>
            </a>
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
            <a href="#modalidades">Modalidades</a>
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
