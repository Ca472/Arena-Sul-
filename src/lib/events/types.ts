import type { EventStatus } from "@/lib/supabase/database.types";

export type EventPhoto = {
  id: string;
  eventId: string;
  url: string;
  storagePath: string | null;
  originalName: string;
  altText: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  displayOrder: number;
};

export type ArenaEvent = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  description: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  status: EventStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  photos: EventPhoto[];
  coverPhoto: EventPhoto | null;
};

export type PublishedEvent = Omit<ArenaEvent, "status"> & {
  status: "published";
};

export type PublishedEventsOptions = {
  /** Maximum returned events, clamped between 1 and 100. Defaults to 12. */
  limit?: number;
};
