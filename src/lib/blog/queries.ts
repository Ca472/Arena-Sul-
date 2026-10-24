import "server-only";

import { connection } from "next/server";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { BLOG_IMAGE_BUCKET, isValidBlogSlug } from "./validation";
import type { BlogPost, BlogPostSummary } from "./types";

const SUMMARY_SELECT = "id,slug,title,excerpt,status,published_at,created_at,updated_at,cover_storage_path,cover_alt";
const DETAIL_SELECT = `${SUMMARY_SELECT},content`;
type BlogRow = Database["public"]["Tables"]["blog_posts"]["Row"];
type SummaryRow = Omit<BlogRow, "content" | "created_by" | "updated_by">;
type DetailRow = SummaryRow & Pick<BlogRow, "content">;

async function coverUrls(rows: SummaryRow[]) {
  const paths = [...new Set(rows.flatMap((row) => row.cover_storage_path ? [row.cover_storage_path] : []))];
  const urls = new Map<string, string>();
  if (!paths.length) return urls;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return urls;
  const { data, error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).createSignedUrls(paths, 3600);
  if (error) {
    console.error(JSON.stringify({ event: "blog_cover_signing_failed", code: error.name }));
    return urls;
  }
  for (const row of data ?? []) {
    if (row.path && row.signedUrl && !row.error) urls.set(row.path, row.signedUrl);
  }
  return urls;
}

function mapSummary(row: SummaryRow, urls: Map<string, string>): BlogPostSummary {
  return {
    id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt,
    status: row.status, publishedAt: row.published_at, createdAt: row.created_at,
    updatedAt: row.updated_at, coverStoragePath: row.cover_storage_path,
    coverUrl: row.cover_storage_path ? urls.get(row.cover_storage_path) ?? null : null,
    coverAlt: row.cover_alt,
  };
}

async function readyClient() {
  if (getRuntimeMode() !== "supabase") return null;
  // Signed cover URLs must not be embedded in static pages beyond their lifetime.
  await connection();
  return createSupabaseServerClient();
}

export async function getPublishedBlogPosts({ limit = 12, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<BlogPostSummary[]> {
  const supabase = await readyClient();
  if (!supabase) return [];
  const safeLimit = Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.trunc(limit))) : 12;
  const safeOffset = Number.isFinite(offset) ? Math.min(1_000_000, Math.max(0, Math.trunc(offset))) : 0;
  const { data, error } = await supabase.from("blog_posts").select(SUMMARY_SELECT)
    .eq("status", "published").lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false }).order("id", { ascending: false }).range(safeOffset, safeOffset + safeLimit - 1);
  if (error) throw new Error("Não foi possível carregar os artigos do blog.");
  const rows = (data ?? []) as SummaryRow[];
  const urls = await coverUrls(rows);
  return rows.map((row) => mapSummary(row, urls));
}

export async function getPublishedBlogPost(slug: string): Promise<BlogPost | null> {
  const normalizedSlug = slug.trim().toLowerCase();
  if (!isValidBlogSlug(normalizedSlug)) return null;
  const supabase = await readyClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_posts").select(DETAIL_SELECT)
    .eq("slug", normalizedSlug).eq("status", "published")
    .lte("published_at", new Date().toISOString()).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o artigo.");
  if (!data) return null;
  const row = data as DetailRow;
  return { ...mapSummary(row, await coverUrls([row])), content: row.content };
}

export async function getPublishedBlogIndex(): Promise<Array<{ slug: string; updatedAt: string }>> {
  const supabase = await readyClient();
  if (!supabase) return [];
  const index: Array<{ slug: string; updatedAt: string }> = [];
  const pageSize = 500;
  const publishedBefore = new Date().toISOString();
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("blog_posts").select("slug,updated_at")
      .eq("status", "published").lte("published_at", publishedBefore)
      .order("updated_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error("Não foi possível carregar o índice do blog.");
    const rows = data ?? [];
    index.push(...rows.map((row) => ({ slug: row.slug, updatedAt: row.updated_at })));
    if (rows.length < pageSize) return index;
  }
}

export async function getAdminBlogPosts(): Promise<BlogPostSummary[]> {
  const supabase = await readyClient();
  if (!supabase) return [];
  const posts: BlogPostSummary[] = [];
  const pageSize = 500;
  // The admin table does not show covers; avoid signing every image in the archive.
  const noCoverUrls = new Map<string, string>();
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("blog_posts").select(SUMMARY_SELECT)
      .order("updated_at", { ascending: false }).order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error("Não foi possível carregar os artigos para edição.");
    const rows = (data ?? []) as SummaryRow[];
    posts.push(...rows.map((row) => mapSummary(row, noCoverUrls)));
    if (rows.length < pageSize) return posts;
  }
}

export async function getAdminBlogPost(id: string): Promise<BlogPost | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = await readyClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("blog_posts").select(DETAIL_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error("Não foi possível carregar o artigo para edição.");
  if (!data) return null;
  const row = data as DetailRow;
  return { ...mapSummary(row, await coverUrls([row])), content: row.content };
}
