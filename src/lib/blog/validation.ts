import { z } from "zod";
import { hasExpectedSiteMediaSignature } from "../site-media/catalog.ts";

export const BLOG_IMAGE_BUCKET = "blog-images";
export const BLOG_COVER_MAX_BYTES = 3 * 1024 * 1024;
export const BLOG_CONTENT_MAX_LENGTH = 80_000;
export const BLOG_COVER_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type BlogCoverMimeType = (typeof BLOG_COVER_MIME_TYPES)[number];

export function isValidBlogSlug(value: string) {
  return value.length >= 3 && value.length <= 160 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export const blogPostSchema = z.object({
  id: z.uuid("Identificador do artigo inválido.").transform((id) => id.toLowerCase()),
  title: z.string().trim().max(120, "O título pode ter até 120 caracteres."),
  slug: z.string().trim().max(160, "A URL pode ter até 160 caracteres.")
    .refine((value) => value === "" || isValidBlogSlug(value), "Use uma URL com letras minúsculas, números e hífens, com pelo menos 3 caracteres."),
  excerpt: z.string().trim().max(240, "O resumo pode ter até 240 caracteres."),
  content: z.string().trim().max(BLOG_CONTENT_MAX_LENGTH, "O texto pode ter até 80 mil caracteres."),
  status: z.enum(["draft", "published"], "Escolha rascunho ou publicado."),
  coverAlt: z.string().trim().max(240, "A descrição da imagem pode ter até 240 caracteres."),
  updatedAt: z.union([z.iso.datetime({ offset: true }), z.literal("")]).default(""),
}).superRefine((value, context) => {
  if (value.status !== "published") return;
  const requirements = [
    ["title", value.title.length >= 3, "Para publicar, informe um título com pelo menos 3 caracteres."],
    ["excerpt", value.excerpt.length >= 20, "Para publicar, escreva um resumo com pelo menos 20 caracteres."],
    ["content", value.content.length >= 80, "Para publicar, escreva um texto com pelo menos 80 caracteres."],
  ] as const;
  for (const [field, valid, message] of requirements) {
    if (!valid) context.addIssue({ code: "custom", path: [field], message });
  }
});

/** Full UUID suffix prevents automatic slugs from colliding between posts. */
export function resolveBlogSlug(slug: string, title: string, id: string) {
  if (slug) return slug;
  const stem = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100).replace(/-+$/g, "");
  return `${stem || "rascunho"}-${id}`;
}

export function validateBlogCover(
  { size, type }: { size: number; type: string },
  bytes?: Uint8Array,
): { valid: true; mimeType: BlogCoverMimeType; extension: string } | { valid: false; message: string } {
  if (size <= 0 || size > BLOG_COVER_MAX_BYTES) {
    return { valid: false, message: "Use uma imagem de até 3 MB, que não esteja vazia." };
  }
  if (!BLOG_COVER_MIME_TYPES.includes(type as BlogCoverMimeType)) {
    return { valid: false, message: "Use uma imagem JPG, PNG ou WebP." };
  }
  if (bytes && (bytes.byteLength !== size || !hasExpectedSiteMediaSignature(bytes, type as BlogCoverMimeType))) {
    return { valid: false, message: "O conteúdo da imagem não corresponde ao formato informado." };
  }
  return { valid: true, mimeType: type as BlogCoverMimeType, extension: type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp" };
}
