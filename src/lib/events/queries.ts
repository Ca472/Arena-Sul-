import "server-only";

import { connection } from "next/server";

import { getRuntimeMode } from "@/lib/config/runtime";
import { DEMO_EVENTS, DEMO_PUBLISHED_EVENTS } from "@/lib/events/fixtures";
import type {
  ArenaEvent,
  EventPhoto,
  PublishedEvent,
  PublishedEventsOptions,
} from "@/lib/events/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EVENT_SELECT =
  "id, slug, title, excerpt, description, location, starts_at, ends_at, status, published_at, created_at, updated_at";

const PHOTO_SELECT =
  "id, event_id, storage_path, original_name, alt_text, mime_type, size_bytes, width, height, display_order";
const PUBLIC_PHOTO_SELECT =
  "id, event_id, storage_path, alt_text, mime_type, size_bytes, width, height, display_order";

type EventRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type PhotoRow = {
  id: string;
  event_id: string;
  storage_path: string;
  original_name?: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  display_order: number;
};

function demoClone<T>(value: T): T {
  return structuredClone(value);
}

function normaliseLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 12;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit ?? 12)));
}

async function mapRowsToEvents(eventRows: EventRow[], photoRows: PhotoRow[]) {
  const supabase = await createSupabaseServerClient();
  const photosByEvent = new Map<string, EventPhoto[]>();
  if (!supabase || photoRows.length === 0) {
    return eventRows.map<ArenaEvent>((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      excerpt: event.excerpt,
      description: event.description,
      location: event.location,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      status: event.status,
      publishedAt: event.published_at,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      photos: [],
      coverPhoto: null,
    }));
  }

  const { data: signedRows, error: signingError } = await supabase.storage
    .from("event-photos")
    .createSignedUrls(photoRows.map(({ storage_path }) => storage_path), 60 * 60);

  if (signingError) {
    throw new Error("Não foi possível carregar as fotos dos eventos.");
  }

  const signedUrls = new Map(
    (signedRows ?? []).flatMap((row) =>
      row.path && row.signedUrl && !row.error
        ? [[row.path, row.signedUrl] as const]
        : [],
    ),
  );

  const mappedPhotos = photoRows.flatMap((photo) => {
    const signedUrl = signedUrls.get(photo.storage_path);
    if (!signedUrl) {
      return [];
    }

    const mapped: EventPhoto = {
      id: photo.id,
      eventId: photo.event_id,
      url: signedUrl,
      storagePath: photo.storage_path,
      originalName: photo.original_name ?? "foto-do-evento",
      altText: photo.alt_text,
      mimeType: photo.mime_type,
      sizeBytes: photo.size_bytes,
      width: photo.width,
      height: photo.height,
      displayOrder: photo.display_order,
    };
    return [mapped];
  });

  for (const mapped of mappedPhotos) {
    const current = photosByEvent.get(mapped.eventId) ?? [];
    current.push(mapped);
    photosByEvent.set(mapped.eventId, current);
  }

  return eventRows.map<ArenaEvent>((event) => {
    const photos = (photosByEvent.get(event.id) ?? []).sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      excerpt: event.excerpt,
      description: event.description,
      location: event.location,
      startsAt: event.starts_at,
      endsAt: event.ends_at,
      status: event.status,
      publishedAt: event.published_at,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      photos,
      coverPhoto: photos[0] ?? null,
    };
  });
}

async function fetchPhotos(
  eventIds: string[],
  access: "public" | "admin" = "admin",
) {
  if (eventIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado.");
  }

  const { data, error } = await supabase
    .from("event_photos")
    .select(access === "public" ? PUBLIC_PHOTO_SELECT : PHOTO_SELECT)
    .in("event_id", eventIds)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Não foi possível carregar as fotos: ${error.message}`);
  }

  return (data ?? []) as unknown as PhotoRow[];
}

/**
 * Stable, server-only public query for the portal.
 *
 * @example
 * const events = await getPublishedEvents({ limit: 6 })
 */
export async function getPublishedEvents(
  options: PublishedEventsOptions = {},
): Promise<PublishedEvent[]> {
  const limit = normaliseLimit(options.limit);

  if (getRuntimeMode() === "demo") {
    return demoClone(DEMO_PUBLISHED_EVENTS.slice(0, limit));
  }

  // Storage links expire after one hour. Rendering at request time prevents a
  // static page or a long-lived Next cache entry from outliving those links.
  await connection();

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Não foi possível carregar os eventos: ${error.message}`);
  }

  const eventRows = (data ?? []) as EventRow[];
  const photoRows = await fetchPhotos(eventRows.map(({ id }) => id), "public");
  const events = await mapRowsToEvents(eventRows, photoRows);

  return events.filter(
    (event): event is PublishedEvent => event.status === "published",
  );
}

/** Returns one published event by its public URL slug, or null when unavailable. */
export async function getPublishedEventBySlug(
  slug: string,
): Promise<PublishedEvent | null> {
  const normalisedSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalisedSlug)) {
    return null;
  }

  if (getRuntimeMode() === "demo") {
    return demoClone(
      DEMO_PUBLISHED_EVENTS.find((event) => event.slug === normalisedSlug) ?? null,
    );
  }

  // See getPublishedEvents: signed photo URLs must be minted per request.
  await connection();

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", normalisedSlug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar o evento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const photoRows = await fetchPhotos([data.id], "public");
  const [event] = await mapRowsToEvents([data as EventRow], photoRows);

  return event?.status === "published" ? (event as PublishedEvent) : null;
}

/** Lightweight public index used by sitemap generation without signing photos. */
export async function getPublishedEventIndex(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  if (getRuntimeMode() === "demo") {
    return DEMO_PUBLISHED_EVENTS.map(({ slug, updatedAt }) => ({
      slug,
      updatedAt,
    }));
  }

  await connection();

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("slug, updated_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Não foi possível montar o índice de eventos: ${error.message}`);
  }

  return (data ?? []).map(({ slug, updated_at }) => ({
    slug,
    updatedAt: updated_at,
  }));
}

export async function getAdminEvents(): Promise<ArenaEvent[]> {
  if (getRuntimeMode() === "demo") {
    return demoClone(DEMO_EVENTS);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Não foi possível carregar os eventos: ${error.message}`);
  }

  const eventRows = (data ?? []) as EventRow[];
  const photoRows = await fetchPhotos(eventRows.map(({ id }) => id));
  return mapRowsToEvents(eventRows, photoRows);
}

export async function getAdminEventById(id: string): Promise<ArenaEvent | null> {
  if (getRuntimeMode() === "demo") {
    return demoClone(DEMO_EVENTS.find((event) => event.id === id) ?? null);
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível carregar o evento: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const photoRows = await fetchPhotos([id]);
  const [event] = await mapRowsToEvents([data as EventRow], photoRows);
  return event ?? null;
}
