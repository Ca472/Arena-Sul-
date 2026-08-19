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

const stats: Array<{ value: string | null; label: string }> = [
  { value: "13", label: "quadras de areia" },
  { value: "1", label: "quadra society" },
  { value: null, label: "área de churrasqueira" },
  { value: null, label: "bar" },
];

const heroSports = [
  {
    name: "Vôlei de Praia",
    image: "/images/hero-volei-praia.jpg",
    className: "hero-sport-slide hero-sport-slide-volleyball",
  },
  {
    name: "Futevôlei",
    image: "/images/hero-futevolei.jpg",
    className: "hero-sport-slide hero-sport-slide-futevolei",
  },
  {
    name: "Beach Tênis",
    image: "/images/hero-beach-tennis.jpg",
    className: "hero-sport-slide hero-sport-slide-beach-tennis",
  },
];

const amenities = [
  "13 quadras de areia",
  "1 quadra de futebol society",
  "3 churrasqueiras para aniversários e confraternizações",
  "Bar e cozinha",
  "Vestiários",
  "Aulas de esportes de areia",
  "Estrutura para grupos e eventos",
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
        <section className="hero" id="inicio">
          <SiteHeader />

          <div className="hero-grid shell">
            <div className="hero-copy">
              <p className="eyebrow">Esporte · Família · Saúde</p>
              <h1 className="hero-title">
                Esporte é saúde. <span>Família é conexão.</span>
              </h1>
              <p className="hero-lead">
                Um ambiente acolhedor para praticar esporte, cuidar da saúde e
                viver bons momentos em família.
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
                  Esporte de areia
                </a>
                <a className="button button-ghost" href="#estrutura">
                  Conheça a estrutura
                </a>
              </div>
            </div>

            <div
              className="hero-visual"
              role="img"
              aria-label="Modalidades em destaque: Vôlei de Praia, Futevôlei e Beach Tênis"
            >
              <div className="hero-sun" aria-hidden="true" />
              <div className="hero-slash hero-slash-one" aria-hidden="true" />
              <div className="hero-slash hero-slash-two" aria-hidden="true" />

              <div className="hero-sports-showcase" aria-hidden="true">
                {heroSports.map((sport, index) => (
                  <figure className={sport.className} key={sport.name}>
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
                      <span>Modalidade em destaque</span>
                      <strong>{sport.name}</strong>
                    </figcaption>
                  </figure>
                ))}

                <div className="hero-sport-indicators">
                  {heroSports.map((sport) => (
                    <span key={sport.name} />
                  ))}
                </div>

                <p className="hero-sports-static-label">
                  Vôlei de Praia · Futevôlei · Beach Tênis
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
              <h2>Um ponto de encontro para saúde e bons momentos.</h2>
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
                  <li key={item}>
                    <span aria-hidden="true">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <StructureGallery />
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

        <Suspense fallback={<InstagramSectionFallback />}>
          <InstagramSection />
        </Suspense>

        <footer className="footer" id="contato">
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
          <div className="footer-grid shell">
            <div className="footer-brand">
              <Image
                src="/images/arena-sul-logo-white.png"
                alt="Arena Sul Sports"
                width={225}
                height={225}
              />
              <p>Esporte. Família. Saúde.</p>
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
              <a href="#instagram">Instagram</a>
            </div>
          </div>
          <div className="footer-bottom shell">
            <p>
              © {new Date().getFullYear()} Arena Sul Sports. Todos os direitos
              reservados.
            </p>
            <a href="/admin">Área administrativa</a>
          </div>
        </footer>
      </main>
    </>
  );
}
