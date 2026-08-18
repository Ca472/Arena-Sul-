import type { ArenaEvent, PublishedEvent } from "@/lib/events/types";

const DEMO_EVENT_ROWS: Array<Omit<ArenaEvent, "coverPhoto">> = [
  {
    id: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d101",
    slug: "festival-arena-sul-2026",
    title: "Festival Arena Sul 2026",
    excerpt: "Um dia inteiro de esporte, convivência e experiências na areia.",
    description:
      "Festival esportivo com partidas abertas, ativações para toda a família e programação especial nas quadras da Arena Sul.",
    location: "Arena Sul Sports",
    startsAt: "2026-09-19T12:00:00.000Z",
    endsAt: "2026-09-19T23:00:00.000Z",
    status: "published",
    publishedAt: "2026-08-12T13:00:00.000Z",
    createdAt: "2026-08-10T13:00:00.000Z",
    updatedAt: "2026-08-12T13:00:00.000Z",
    photos: [
      {
        id: "3d66f3d8-4614-4729-a894-c00fd6679101",
        eventId: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d101",
        url: "/images/events-banner.webp",
        storagePath: null,
        originalName: "events-banner.jpg",
        altText: "Evento esportivo na Arena Sul",
        mimeType: "image/jpeg",
        sizeBytes: 0,
        width: 1600,
        height: 900,
        displayOrder: 0,
      },
      {
        id: "3d66f3d8-4614-4729-a894-c00fd6679102",
        eventId: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d101",
        url: "/images/tournament-podium.webp",
        storagePath: null,
        originalName: "tournament-podium.png",
        altText: "Pódio do Festival Arena Sul",
        mimeType: "image/png",
        sizeBytes: 0,
        width: 1200,
        height: 800,
        displayOrder: 1,
      },
    ],
  },
  {
    id: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d102",
    slug: "experiencia-corporativa-na-areia",
    title: "Experiência corporativa na areia",
    excerpt: "Integração de equipes com esporte, gastronomia e estrutura completa.",
    description:
      "Uma experiência corporativa desenhada para aproximar pessoas, com atividades guiadas, alimentação e ambiente reservado.",
    location: "Espaço de eventos — Arena Sul Sports",
    startsAt: "2026-10-08T21:00:00.000Z",
    endsAt: "2026-10-09T01:00:00.000Z",
    status: "published",
    publishedAt: "2026-08-14T16:00:00.000Z",
    createdAt: "2026-08-13T16:00:00.000Z",
    updatedAt: "2026-08-14T16:00:00.000Z",
    photos: [
      {
        id: "3d66f3d8-4614-4729-a894-c00fd6679201",
        eventId: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d102",
        url: "/images/corporate-night.webp",
        storagePath: null,
        originalName: "corporate-night.png",
        altText: "Evento corporativo à noite",
        mimeType: "image/png",
        sizeBytes: 0,
        width: 1200,
        height: 800,
        displayOrder: 0,
      },
    ],
  },
  {
    id: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d103",
    slug: "copa-de-beach-tennis",
    title: "Copa de Beach Tennis",
    excerpt: "Competição em preparação pela equipe da Arena Sul.",
    description:
      "Torneio de beach tennis com categorias para diferentes níveis. Este conteúdo ainda está sendo preparado e não aparece no portal público.",
    location: "Quadras Arena Sul",
    startsAt: "2026-11-07T11:00:00.000Z",
    endsAt: "2026-11-08T22:00:00.000Z",
    status: "draft",
    publishedAt: null,
    createdAt: "2026-08-15T18:00:00.000Z",
    updatedAt: "2026-08-15T18:00:00.000Z",
    photos: [
      {
        id: "3d66f3d8-4614-4729-a894-c00fd6679301",
        eventId: "e8f5ffbd-b056-4c8a-91c8-0c2d0ec0d103",
        url: "/images/racket-woman.webp",
        storagePath: null,
        originalName: "racket-woman.png",
        altText: "Atleta de beach tennis",
        mimeType: "image/png",
        sizeBytes: 0,
        width: 1200,
        height: 800,
        displayOrder: 0,
      },
    ],
  },
];

export const DEMO_EVENTS: ArenaEvent[] = DEMO_EVENT_ROWS.map((event) => ({
  ...event,
  coverPhoto: event.photos[0] ?? null,
}));

export const DEMO_PUBLISHED_EVENTS: PublishedEvent[] = DEMO_EVENTS.filter(
  (event): event is PublishedEvent => event.status === "published",
);
