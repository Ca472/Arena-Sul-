export type SiteMediaSection =
  | "Time Arena Sul"
  | "Destaques da página"
  | "Estrutura"
  | "Modalidades";

export const SITE_MEDIA_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const SITE_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type SiteMediaMimeType = (typeof SITE_MEDIA_MIME_TYPES)[number];

export function getSiteMediaExtension(mimeType: SiteMediaMimeType) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }
  return mimeType === "image/png" ? "png" : "webp";
}

/** Verifies the binary signature instead of trusting only browser metadata. */
export function hasExpectedSiteMediaSignature(
  bytes: Uint8Array,
  mimeType: SiteMediaMimeType,
) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((value, index) => bytes[index] === value);
  }

  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export type SiteMediaDefinition = {
  key: string;
  section: SiteMediaSection;
  label: string;
  description: string;
  defaultSrc: string;
  alt: string;
  recommendation: string;
  previewAspect: string;
};

export const SITE_MEDIA_DEFINITIONS = [
  {
    key: "team-julio-neto",
    section: "Time Arena Sul",
    label: "Profº Julio Neti — Vôlei de Praia",
    description: "Primeira foto do carrossel de professores.",
    defaultSrc: "/images/hero-volei-praia.jpg",
    alt: "Professor Julio Neti, do time Arena Sul, com uma bola de vôlei de praia.",
    recommendation: "Foto vertical 3:4 · ideal 1200 × 1600 px",
    previewAspect: "3 / 4",
  },
  {
    key: "team-gett-lima",
    section: "Time Arena Sul",
    label: "Profº Gett Lima — Futevôlei",
    description: "Segunda foto do carrossel de professores.",
    defaultSrc: "/images/hero-futevolei-gett-lima.jpg",
    alt: "Professor Gett Lima praticando futevôlei na Arena Sul.",
    recommendation: "Foto vertical 3:4 · ideal 1200 × 1600 px",
    previewAspect: "3 / 4",
  },
  {
    key: "team-edson-junior",
    section: "Time Arena Sul",
    label: "Profº Edson Junior — Vôlei de Praia",
    description: "Terceira foto do carrossel de professores.",
    defaultSrc: "/images/hero-volei-praia-time-arena.jpg",
    alt: "Professor Edson Junior, do time Arena Sul, na quadra de vôlei de praia.",
    recommendation: "Foto vertical 3:4 · ideal 1200 × 1600 px",
    previewAspect: "3 / 4",
  },
  {
    key: "team-vinicius-alves",
    section: "Time Arena Sul",
    label: "Profº Vinicius Alves — Beach Tennis",
    description: "Quarta foto do carrossel de professores.",
    defaultSrc: "/images/hero-beach-tennis.jpg",
    alt: "Professor Vinicius Alves em uma quadra de Beach Tennis da Arena Sul.",
    recommendation: "Foto vertical 3:4 · ideal 1200 × 1600 px",
    previewAspect: "3 / 4",
  },
  {
    key: "team-wallacy",
    section: "Time Arena Sul",
    label: "Profº Wallacy — Futevôlei",
    description: "Quinta foto do carrossel de professores.",
    defaultSrc: "/images/hero-futevolei-wallacy.jpg",
    alt: "Professor Wallacy praticando futevôlei na Arena Sul.",
    recommendation: "Foto vertical 3:4 · ideal 1200 × 1600 px",
    previewAspect: "3 / 4",
  },
  {
    key: "home-about-overview",
    section: "Destaques da página",
    label: "Nossa essência — Foto da Arena",
    description: "Imagem da seção que apresenta a história e a essência da Arena.",
    defaultSrc: "/images/arena-drone-2.jpg",
    alt: "Vista aérea das quadras e da estrutura da Arena Sul Sports.",
    recommendation: "Foto vertical 4:5 ou 3:4 · mínimo 1200 px de altura",
    previewAspect: "4 / 5",
  },
  {
    key: "home-tour-preview",
    section: "Destaques da página",
    label: "Tour 360º — Foto de chamada",
    description: "Imagem clicável que convida o visitante a abrir o Tour 360º.",
    defaultSrc: "/images/arena-drone-2.jpg",
    alt: "Vista aérea da estrutura esportiva da Arena Sul.",
    recommendation: "Foto horizontal 16:10 · ideal 1600 × 1000 px",
    previewAspect: "16 / 10",
  },
  {
    key: "structure-sand-courts",
    section: "Estrutura",
    label: "13 quadras de areia",
    description: "Primeira foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-quadras-areia.jpg",
    alt: "Quadras de areia da Arena Sul com redes sob o céu azul.",
    recommendation: "Foto horizontal 4:3 ou 16:9 · assunto centralizado",
    previewAspect: "16 / 9",
  },
  {
    key: "structure-aerial-view",
    section: "Estrutura",
    label: "Estrutura esportiva completa",
    description: "Segunda foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-vista-aerea.jpg",
    alt: "Vista aérea das quadras e da estrutura da Arena Sul.",
    recommendation: "Foto vertical 9:16 · mínimo 1200 px de altura",
    previewAspect: "9 / 16",
  },
  {
    key: "structure-sand-classes",
    section: "Estrutura",
    label: "Aulas de esportes de areia",
    description: "Terceira foto do carrossel Estrutura.",
    defaultSrc: "/images/group-class.webp",
    alt: "Atividade coletiva em uma quadra de areia da Arena Sul.",
    recommendation: "Foto vertical 9:16 · mínimo 1200 px de altura",
    previewAspect: "9 / 16",
  },
  {
    key: "structure-barbecue",
    section: "Estrutura",
    label: "3 churrasqueiras",
    description: "Quarta foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-churrasqueiras-v2.png",
    alt: "Área de churrasqueira coberta da Arena Sul com mesas, bancos e cozinha de apoio.",
    recommendation: "Foto horizontal 16:9 · assunto centralizado",
    previewAspect: "16 / 9",
  },
  {
    key: "structure-bar-kitchen",
    section: "Estrutura",
    label: "Bar e cozinha",
    description: "Quinta foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-bar-cozinha-v2.png",
    alt: "Bar e cozinha da Arena Sul diante da área de convivência.",
    recommendation: "Foto horizontal 16:9 · assunto centralizado",
    previewAspect: "16 / 9",
  },
  {
    key: "structure-leisure",
    section: "Estrutura",
    label: "Diversos espaços de lazer",
    description: "Sexta foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-espacos-lazer-v2.png",
    alt: "Espaço de convivência coberto da Arena Sul com mesas e vista para as quadras.",
    recommendation: "Foto horizontal 16:9 · assunto centralizado",
    previewAspect: "16 / 9",
  },
  {
    key: "structure-events",
    section: "Estrutura",
    label: "Torneios, eventos corporativos e escolares",
    description: "Sétima foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-eventos-area-lazer-v2.png",
    alt: "Vista superior da área de convivência e das quadras de areia da Arena Sul.",
    recommendation: "Foto vertical 9:16 · mínimo 1200 px de altura",
    previewAspect: "9 / 16",
  },
  {
    key: "structure-sand-courts-invitation",
    section: "Estrutura",
    label: "13 quadras de areia te esperando",
    description: "Oitava foto do carrossel Estrutura.",
    defaultSrc: "/images/estrutura-13-quadras-panorama.png",
    alt: "Vista panorâmica das quadras de areia e da área de convivência da Arena Sul.",
    recommendation: "Foto horizontal 16:9 · assunto centralizado",
    previewAspect: "16 / 9",
  },
  {
    key: "modality-beach-tennis",
    section: "Modalidades",
    label: "Card 01 — Beach Tennis",
    description: "Foto do card que abre as opções de Beach Tennis.",
    defaultSrc: "/images/modality-beach-tennis-turma-v2.png",
    alt: "Turma com raquetes na quadra de Beach Tennis da Arena Sul.",
    recommendation: "Foto quadrada · ideal 1200 × 1200 px",
    previewAspect: "1 / 1",
  },
  {
    key: "modality-futevolei",
    section: "Modalidades",
    label: "Card 02 — Futevôlei",
    description: "Foto do card que abre as opções de Futevôlei.",
    defaultSrc: "/images/modality-futevolei-arena.jpg",
    alt: "Jogador de futevôlei controla a bola diante da rede.",
    recommendation: "Foto quadrada · ideal 1200 × 1200 px",
    previewAspect: "1 / 1",
  },
  {
    key: "modality-beach-volleyball",
    section: "Modalidades",
    label: "Card 03 — Vôlei de Praia",
    description: "Foto do card que abre as opções de Vôlei de Praia.",
    defaultSrc: "/images/modality-volei-praia-mergulho.jpg",
    alt: "Jogador mergulha para alcançar a bola no vôlei de praia.",
    recommendation: "Foto quadrada · ideal 1200 × 1200 px",
    previewAspect: "1 / 1",
  },
  {
    key: "modality-functional-class",
    section: "Modalidades",
    label: "Card 04 — Aula Funcional",
    description: "Foto do card que abre as opções de Aula Funcional.",
    defaultSrc: "/images/modality-aula-funcional-arena-v2.png",
    alt: "Participantes em uma aula funcional na quadra de areia.",
    recommendation: "Foto quadrada · ideal 1200 × 1200 px",
    previewAspect: "1 / 1",
  },
  {
    key: "modality-society-football",
    section: "Modalidades",
    label: "Card 05 — Futebol Society",
    description: "Foto do card que abre a opção de Futebol Society.",
    defaultSrc: "/images/modality-futebol-society.png",
    alt: "Bola de futebol na quadra society da Arena Sul.",
    recommendation: "Foto quadrada · ideal 1200 × 1200 px",
    previewAspect: "1 / 1",
  },
] as const satisfies readonly SiteMediaDefinition[];

export type SiteMediaSlot = (typeof SITE_MEDIA_DEFINITIONS)[number]["key"];
export type SiteMediaMap = Record<SiteMediaSlot, string>;

export const SITE_MEDIA_SECTIONS: readonly SiteMediaSection[] = [
  "Time Arena Sul",
  "Destaques da página",
  "Estrutura",
  "Modalidades",
];

const SITE_MEDIA_KEYS = new Set<string>(
  SITE_MEDIA_DEFINITIONS.map(({ key }) => key),
);

export function isSiteMediaSlot(value: unknown): value is SiteMediaSlot {
  return typeof value === "string" && SITE_MEDIA_KEYS.has(value);
}

export function getDefaultSiteMediaMap(): SiteMediaMap {
  return Object.fromEntries(
    SITE_MEDIA_DEFINITIONS.map(({ key, defaultSrc }) => [key, defaultSrc]),
  ) as SiteMediaMap;
}

export function resolveSiteMediaMap(
  overrides: Iterable<{ slot: string; url: string }>,
): SiteMediaMap {
  const media = getDefaultSiteMediaMap();

  for (const override of overrides) {
    if (isSiteMediaSlot(override.slot) && override.url.trim()) {
      media[override.slot] = override.url;
    }
  }

  return media;
}
