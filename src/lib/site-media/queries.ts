import "server-only";

import { getRuntimeMode } from "@/lib/config/runtime";
import {
  resolveSiteMediaMap,
  SITE_MEDIA_DEFINITIONS,
  type SiteMediaMap,
  type SiteMediaSlot,
} from "@/lib/site-media/catalog";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const SITE_MEDIA_BUCKET = "site-media";

type PublicSiteMediaRow = {
  slot: string;
  storage_path: string;
};

type AdminSiteMediaRow = PublicSiteMediaRow & {
  original_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  updated_at: string;
};

export type AdminSiteMediaItem = {
  key: SiteMediaSlot;
  section: (typeof SITE_MEDIA_DEFINITIONS)[number]["section"];
  label: string;
  description: string;
  defaultSrc: string;
  alt: string;
  recommendation: string;
  previewAspect: string;
  currentUrl: string;
  isDefault: boolean;
  override: {
    storagePath: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    width: number | null;
    height: number | null;
    updatedAt: string;
  } | null;
};

function getPublicStorageUrl(
  supabase: NonNullable<ReturnType<typeof createSupabaseServiceRoleClient>>,
  storagePath: string,
) {
  return supabase.storage.from(SITE_MEDIA_BUCKET).getPublicUrl(storagePath).data
    .publicUrl;
}

/**
 * Returns all live site-photo URLs, falling back to the versioned files in
 * `public/images` whenever Supabase is unavailable or a slot has no override.
 */
export async function getSiteMediaMap(): Promise<SiteMediaMap> {
  if (getRuntimeMode() !== "supabase") {
    return resolveSiteMediaMap([]);
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return resolveSiteMediaMap([]);
  }

  const { data, error } = await supabase
    .from("site_media")
    .select("slot, storage_path")
    .order("slot");

  if (error) {
    console.error("Falha ao carregar as fotos configuráveis do site.", {
      code: error.code,
      message: error.message,
    });
    return resolveSiteMediaMap([]);
  }

  return resolveSiteMediaMap(
    ((data ?? []) as PublicSiteMediaRow[]).map((row) => ({
      slot: row.slot,
      url: getPublicStorageUrl(supabase, row.storage_path),
    })),
  );
}

/** Returns every editable slot plus its current override for the admin UI. */
export async function getAdminSiteMediaItems(): Promise<AdminSiteMediaItem[]> {
  if (getRuntimeMode() !== "supabase") {
    return SITE_MEDIA_DEFINITIONS.map((definition) => ({
      ...definition,
      currentUrl: definition.defaultSrc,
      isDefault: true,
      override: null,
    }));
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado para gerenciar as fotos.");
  }

  const { data, error } = await supabase
    .from("site_media")
    .select(
      "slot, storage_path, original_name, mime_type, size_bytes, width, height, updated_at",
    )
    .order("slot");

  if (error) {
    throw new Error(`Não foi possível carregar as fotos do site: ${error.message}`);
  }

  const rows = new Map(
    ((data ?? []) as AdminSiteMediaRow[]).map((row) => [row.slot, row]),
  );

  return SITE_MEDIA_DEFINITIONS.map((definition) => {
    const row = rows.get(definition.key);
    if (!row) {
      return {
        ...definition,
        currentUrl: definition.defaultSrc,
        isDefault: true,
        override: null,
      };
    }

    return {
      ...definition,
      currentUrl: getPublicStorageUrl(supabase, row.storage_path),
      isDefault: false,
      override: {
        storagePath: row.storage_path,
        originalName: row.original_name,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        width: row.width,
        height: row.height,
        updatedAt: row.updated_at,
      },
    };
  });
}

export { SITE_MEDIA_BUCKET };
