import Image from "next/image";
import { Suspense } from "react";
import { ArenaLoader } from "@/components/arena-loader";
import { ArenaOpening } from "@/components/arena-opening";
import {
  InstagramSection,
  InstagramSectionFallback,
} from "@/components/instagram-section";
import { ModalityCards } from "@/components/modality-cards";
import { SiteHeader } from "@/components/site-header";
import { StructureGallery } from "@/components/structure-gallery";
import { buildWhatsAppUrl } from "@/lib/config/whatsapp";

type ArenaStat = {
  value: string | null;
  label: string;
  ariaLabel?: string;
};

type Amenity = {
  label: string;
};

type GoogleTestimonial = {
  author: string;
  excerpt: string;
};

const stats: ArenaStat[] = [
  { value: "13", label: "quadras de areia" },
  { value: "1", label: "quadra society" },
  { value: "3", label: "áreas de churrasqueira" },
  { value: null, label: "bares e cozinha completos" },
  {
    value: "90",
    label: "carros · capacidade do estacionamento",
    ariaLabel: "Estacionamento para 90 carros",
  },
];

const heroSports = [
  {
    id: "volei-praia",
    name: "Vôlei de Praia",
    professor: "Profº Julio Neti",
    image: "/images/hero-volei-praia.jpg",
    className: "hero-sport-slide hero-sport-slide-volleyball",
  },
  {
    id: "futevolei",
    name: "Futevôlei",
    professor: "Profº Gett Lima",
    image: "/images/hero-futevolei.jpg",
    className: "hero-sport-slide hero-sport-slide-futevolei",
  },
  {
    id: "volei-praia-edson",
    name: "Vôlei de Praia",
    professor: "Profº Edson Junior",
    image: "/images/hero-volei-praia-time-arena.jpg",
    className: "hero-sport-slide hero-sport-slide-volleyball-athlete",
  },
  {
    id: "beach-tennis",
    name: "Beach Tennis",
    professor: "Profº Vinicius Alves",
    image: "/images/hero-beach-tennis.jpg",
    className: "hero-sport-slide hero-sport-slide-beach-tennis",
  },
  {
    id: "futevolei-wallacy",
    name: "Futevôlei",
    professor: "Profº Wallacy",
    image: "/images/hero-futevolei-wallacy.jpg",
    className: "hero-sport-slide hero-sport-slide-futevolei-wallacy",
  },
];

const amenities: Amenity[] = [
  { label: "13 quadras de areia" },
  { label: "1 quadra de futebol society" },
  { label: "3 churrasqueiras para aniversários e confraternizações" },
  { label: "Bar e cozinha" },
  { label: "Vestiários" },
  { label: "Aulas de esportes de areia" },
  { label: "Estrutura para grupos e eventos" },
];

const googleTestimonials: GoogleTestimonial[] = [
  {
    author: "Eduardo Barreto",
    excerpt: "Muito bom.",
  },
  {
    author: "Yorbi Calzadilla",
    excerpt: "Ambiente excelente",
  },
  {
    author: "Glaucia Kajiyama",
    excerpt: "Excelente local para praticar esportes em família e com amigos.",
  },
  {
    author: "Ubiratan Oliveira",
    excerpt:
      "Lugar ótimo pra se divertir com amigos e familiares. Só precisa dar uma arrumadinha no estacionamento.",
  },
  {
    author: "Agnaldo Tinho",
    excerpt: "Bom",
  },
];

const contactUrl = buildWhatsAppUrl();

const arenaLocation =
  "Arena Sul Sports, Rua Maurício Cardoso, 220, Jardim Sul, São José dos Campos, SP, 12236-495, Brasil";
const arenaGooglePlaceId = "ChIJkWB_KrNKzJQR-wIxev1IPvc";
const mapsPlaceUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(arenaLocation)}&query_place_id=${arenaGooglePlaceId}`;
const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(arenaLocation)}&destination_place_id=${arenaGooglePlaceId}`;
const wazeDirectionsUrl =
  "https://www.waze.com/ul?ll=-23.2513669%2C-45.8921909&navigate=yes&utm_source=arena_sul_portal";
const mapsEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3665.7724281961564!2d-45.892190899999996!3d-23.251366899999994!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94cc4ab32a7f6091%3A0xf73e48fd7a3102fb!2sArena%20Sul%20Sports!5e0!3m2!1spt-BR!2sbr!4v1787057333290!5m2!1spt-BR!2sbr";
const virtualTourUrl =
  "https://boradronar.com.br/tour/arenasulsports/output/";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: "Arena Sul Sports",
  url: "https://www.arenasulsports.com/",
  telephone: "+55 12 3307-1093",
  image: "https://www.arenasulsports.com/images/arena-drone-2.jpg",
  description:
    "Arena esportiva em São José dos Campos para saúde, convivência em família e eventos corporativos e escolares.",
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

export default function Home() {
  return (
    <>
      <ArenaOpening>
        <ArenaLoader />
      </ArenaOpening>
      <main className="public-site">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <section className="hero" id="inicio" tabIndex={-1}>
          <SiteHeader />

          <div className="hero-grid shell">
            <div className="hero-copy">
              <p className="eyebrow">Esporte · Família · Saúde</p>
              <h1 className="hero-title">
                Esporte é saúde
                <span>Maior Complexo Esportivo do Vale do Paraíba</span>
              </h1>
              <p className="hero-lead">
                Um ambiente acolhedor para praticar esporte, cuidar da saúde e
                viver bons momentos em família e amigos.
              </p>
              <div className="hero-actions">
                <a
                  className="button button-primary"
                  href={contactUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fale conosco
                </a>
                <a className="button button-ghost" href="#modalidades">
                  Esportes de areia
                </a>
                <a className="button button-ghost" href="#estrutura">
                  Conheça a estrutura
                </a>
              </div>
            </div>

            <div
              className="hero-visual"
              role="img"
              aria-label="Time Arena Sul: professores Julio Neti, Gett Lima, Edson Junior, Vinicius Alves e Wallacy"
            >
              <div className="hero-sun" aria-hidden="true" />
              <div className="hero-slash hero-slash-one" aria-hidden="true" />
              <div className="hero-slash hero-slash-two" aria-hidden="true" />

              <div className="hero-sports-showcase" aria-hidden="true">
                {heroSports.map((sport, index) => (
                  <figure className={sport.className} key={sport.id}>
                    <Image
                      className="hero-sport-photo"
                      src={sport.image}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 72vw, (max-width: 900px) 42vw, 390px"
                      loading={index === 0 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                    />
                    <figcaption className="hero-sport-caption">
                      <span>Time Arena Sul</span>
                      <strong>{sport.professor}</strong>
                      <small>{sport.name}</small>
                    </figcaption>
                  </figure>
                ))}

                <div className="hero-sport-indicators">
                  {heroSports.map((sport) => (
                    <span key={sport.id} />
                  ))}
                </div>

                <p className="hero-sports-static-label">
                  Time Arena Sul · Profº Julio Neti · Vôlei de Praia
                </p>
              </div>

              <p className="visual-note">Esporte. Família. Saúde.</p>
            </div>
          </div>

          <div
            className="stats shell"
            role="group"
            aria-label="Estrutura e comodidades da Arena Sul"
          >
            {stats.map((stat) => (
              <div
                className={stat.value === null ? "stat stat-feature" : "stat"}
                key={stat.label}
                aria-label={stat.ariaLabel}
              >
                {stat.value !== null ? <strong>{stat.value}</strong> : null}
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about section" id="arena">
          <div className="about-grid shell">
            <div className="about-media">
              <Image
                src="/images/arena-drone-2.jpg"
                alt="Vista aérea das quadras e da estrutura da Arena Sul Sports"
                fill
                sizes="(max-width: 900px) 100vw, 52vw"
              />
              <div className="about-badge">
                <strong>9</strong>
                <span>anos de história no esporte da região</span>
              </div>
            </div>

            <div className="about-copy">
              <p className="section-kicker">Nossa essência</p>
              <h2>
                Um ponto de encontro para saúde, lazer e bons momentos.
              </h2>
              <p>
                A Arena Sul aproxima famílias, amigos, escolas e empresas em um
                ambiente acolhedor para praticar esporte, cuidar do bem-estar e
                compartilhar experiências.
              </p>
              <a className="text-link" href="#estrutura">
                Conheça o espaço <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        <section className="amenities section" id="estrutura">
          <div className="amenities-heading shell">
            <div className="amenities-copy">
              <p className="section-kicker">Estrutura</p>
              <h2>Esporte, saúde e convivência.</h2>
            </div>
            <div className="amenities-details">
              <p className="section-intro">
                Quadras e áreas de convivência para jogos, encontros, eventos
                corporativos e eventos escolares.
              </p>
              <ul className="amenities-list">
                {amenities.map((item) => (
                  <li key={item.label}>
                    <span className="amenity-check" aria-hidden="true">
                      ✓
                    </span>
                    <span className="amenity-content">{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <StructureGallery />
        </section>

        <section
          className="virtual-tour section"
          id="tour-360"
          aria-labelledby="virtual-tour-title"
        >
          <div className="virtual-tour-grid shell">
            <div className="virtual-tour-copy">
              <p className="section-kicker light">Tour virtual 360º</p>
              <h2 id="virtual-tour-title">Explore a Arena por todos os ângulos.</h2>
              <p>
                Navegue pelos pontos do complexo em imagens panorâmicas e
                conheça a estrutura antes mesmo da sua visita.
              </p>
              <a
                className="button button-tour"
                href={virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir o Tour Virtual 360 graus da Arena Sul em uma nova aba"
              >
                Iniciar Tour 360º <span aria-hidden="true">↗</span>
              </a>
              <small>Experiência interativa aberta em uma nova aba.</small>
            </div>

            <a
              className="virtual-tour-preview"
              href={virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir vista panorâmica da Arena Sul no Tour Virtual 360 graus"
            >
              <Image
                src="/images/arena-drone-2.jpg"
                alt="Vista aérea da estrutura esportiva da Arena Sul"
                fill
                sizes="(max-width: 850px) calc(100vw - 28px), 56vw"
              />
              <span className="virtual-tour-shade" aria-hidden="true" />
              <span className="virtual-tour-badge" aria-hidden="true">
                360º
              </span>
              <span className="virtual-tour-action">
                Clique e explore <span aria-hidden="true">→</span>
              </span>
            </a>
          </div>
        </section>

        <section className="modalities section" id="modalidades">
          <div className="section-heading shell">
            <div>
              <p className="section-kicker">Esportes</p>
              <h2>Escolha seu esporte.</h2>
            </div>
            <div className="section-summary">
              <p>
                Aulas, treinos e jogos para diferentes níveis, com foco em
                saúde, convivência e diversão.
              </p>
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

          <ModalityCards />
        </section>

        <section
          className="testimonials section"
          id="depoimentos"
          aria-labelledby="testimonials-title"
        >
          <div className="testimonials-heading shell">
            <div className="testimonials-heading-copy">
              <p className="section-kicker">Depoimentos reais</p>
              <h2 id="testimonials-title">Quem conhece a Arena, recomenda.</h2>
              <p className="testimonials-recency">
                Últimas 5 avaliações recebidas
              </p>
            </div>
            <a
              className="google-rating"
              href={mapsPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver todas as avaliações da Arena Sul no Google Maps"
            >
              <strong>4,5</strong>
              <span className="google-rating-stars" aria-hidden="true">
                ★★★★★
              </span>
              <span>Mais de 600 avaliações no Google</span>
            </a>
          </div>

          <div className="testimonials-grid shell">
            {googleTestimonials.map((testimonial) => (
              <article className="testimonial-card" key={testimonial.author}>
                <div className="testimonial-meta">
                  <span className="testimonial-source">Avaliação do Google</span>
                  <span
                    className="testimonial-stars"
                    aria-label="5 de 5 estrelas"
                  >
                    ★★★★★
                  </span>
                </div>
                <blockquote>
                  <p>“{testimonial.excerpt}”</p>
                </blockquote>
                <footer>
                  <strong>{testimonial.author}</strong>
                  <span aria-hidden="true">G</span>
                </footer>
              </article>
            ))}
          </div>

          <div className="testimonials-action shell">
            <a
              className="text-link"
              href={mapsPlaceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver todas as avaliações no Google <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

        <Suspense fallback={<InstagramSectionFallback />}>
          <InstagramSection />
        </Suspense>

        <footer className="footer" id="contato">
          <div className="footer-shell shell">
            <section
              className="footer-location"
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
                <div className="footer-location-actions">
                  <a
                    className="button button-location"
                    href={mapsDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Traçar rota para a Arena Sul Sports no Google Maps (abre em uma nova aba)"
                  >
                    Traçar rota no Google Maps <span aria-hidden="true">↗</span>
                  </a>
                  <a
                    className="button button-location button-location-waze"
                    href={wazeDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Traçar rota para a Arena Sul Sports no Waze (abre em uma nova aba)"
                  >
                    Traçar rota no Waze <span aria-hidden="true">↗</span>
                  </a>
                </div>
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

            <div className="footer-grid">
              <div className="footer-brand">
                <Image
                  src="/images/arena-sul-logo-white.png"
                  alt="Arena Sul Sports"
                  width={225}
                  height={225}
                />
                <p>Esporte. Família. Saúde.</p>
              </div>
              <div className="footer-group">
                <h2>Fale com a gente</h2>
                <div className="footer-link-row">
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
              </div>
              <nav className="footer-group" aria-label="Explore o site">
                <h2>Explore</h2>
                <div className="footer-link-row">
                  <a href="#arena">A Arena</a>
                  <a href="#estrutura">Estrutura</a>
                  <a href="#modalidades">Esportes</a>
                  <a href="#depoimentos">Avaliações</a>
                  <a
                    href={virtualTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tour 360º <span aria-hidden="true">↗</span>
                  </a>
                  <a href="#instagram">Instagram</a>
                </div>
              </nav>
            </div>

            <div className="footer-bottom">
              <p>
                © {new Date().getFullYear()} Arena Sul Sports. Todos os direitos
                reservados.
              </p>
              <a className="footer-top-link" href="#inicio">
                Voltar ao topo <span aria-hidden="true">↑</span>
              </a>
              <a href="/admin">Área administrativa</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
