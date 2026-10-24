"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/auth/admin";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BLOG_IMAGE_BUCKET, blogPostSchema, resolveBlogSlug, validateBlogCover } from "@/lib/blog/validation";
import { parseRichTextContent, RichTextValidationError } from "@/lib/blog/rich-text";
import { normalizeOptionalBlogCoverEntry } from "@/lib/blog/cover-input";
import type { BlogFormState, BlogInlineImageUploadState } from "@/lib/blog/types";

const staleMessage = "Este artigo foi alterado em outra janela. Atualize a página antes de salvar novamente.";
const postIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Staged images remain private until the document is saved and published. */
export async function uploadBlogInlineImageAction(formData: FormData): Promise<BlogInlineImageUploadState> {
  if (getRuntimeMode() === "demo") {
    return { status: "error", message: "O modo demonstração não envia arquivos. Entre no painel real para salvar as fotos." };
  }
  const admin = await getAdminIdentity();
  if (!admin || admin.isDemo) return { status: "error", message: "Sua sessão expirou. Entre novamente antes de enviar uma foto." };
  const postId = formData.get("postId");
  const file = formData.get("file");
  if (typeof postId !== "string" || !postIdPattern.test(postId)) {
    return { status: "error", message: "O artigo não foi identificado. Atualize a página e tente novamente." };
  }
  if (!file || typeof file === "string") return { status: "error", message: "Selecione uma foto JPG, PNG ou WebP." };
  const metadata = validateBlogCover(file);
  if (!metadata.valid) return { status: "error", message: metadata.message };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const validated = validateBlogCover(file, bytes);
  if (!validated.valid) return { status: "error", message: validated.message };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Não foi possível preparar o envio. Tente novamente." };
  const normalizedId = postId.toLowerCase();
  const filename = `${randomUUID()}.${validated.extension}`;
  const storagePath = `${normalizedId}/${filename}`;
  const { error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).upload(storagePath, bytes, {
    contentType: validated.mimeType, cacheControl: "3600", upsert: false,
  });
  if (error) {
    console.error(JSON.stringify({ event: "blog_inline_image_upload_failed", code: error.name }));
    return { status: "error", message: "Não foi possível enviar a foto. Tente novamente." };
  }
  return {
    status: "success", message: "Foto enviada. Salve o artigo para guardar sua posição no texto.",
    storagePath, src: `/api/blog/images/${normalizedId}/${filename}`,
  };
}

export async function saveBlogPostAction(
  _previousState: BlogFormState,
  formData: FormData,
): Promise<BlogFormState> {
  if (getRuntimeMode() === "demo") {
    return { status: "error", message: "O modo demonstração permite a prévia, mas não salva nem publica artigos." };
  }
  const admin = await getAdminIdentity();
  if (!admin || admin.isDemo) {
    return { status: "error", message: "Sua sessão expirou. Entre novamente antes de salvar." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "error", message: "Supabase não está configurado." };

  const parsed = blogPostSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? "",
    slug: formData.get("slug") ?? "",
    excerpt: formData.get("excerpt") ?? "",
    content: formData.get("content") ?? "",
    contentFormat: formData.get("contentFormat") ?? "markdown",
    status: formData.get("status"),
    coverAlt: formData.get("coverAlt") ?? "",
    updatedAt: formData.get("updatedAt") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados antes de salvar.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const post = parsed.data;
  let content = post.content;
  let inlineImagePaths: string[] = [];
  if (post.contentFormat === "richtext") {
    try {
      const document = parseRichTextContent(content, { postId: post.id });
      content = document.serialized;
      inlineImagePaths = document.imagePaths;
    } catch (error) {
      const message = error instanceof RichTextValidationError ? error.message : "O conteúdo visual não pôde ser validado.";
      return { status: "error", message, fieldErrors: { content: [message] } };
    }
    if (inlineImagePaths.length) {
      const { data: images, error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).createSignedUrls(inlineImagePaths, 60);
      if (error || !inlineImagePaths.every((path) => images?.some((image) => image.path === path && image.signedUrl && !image.error))) {
        return { status: "error", message: "Uma das fotos do texto não foi encontrada. Envie a foto novamente antes de salvar.", fieldErrors: { content: ["Confira as fotos inseridas no artigo."] } };
      }
    }
  }
  const coverEntry = formData.get("cover");
  if (typeof coverEntry === "string") {
    return { status: "error", message: "Selecione uma imagem para a capa.", fieldErrors: { cover: ["Arquivo de imagem inválido."] } };
  }
  const cover = normalizeOptionalBlogCoverEntry(coverEntry);
  let coverBytes: Uint8Array | null = null;
  let coverExtension: string | null = null;
  if (cover) {
    const metadata = validateBlogCover(cover);
    if (!metadata.valid) return { status: "error", message: metadata.message, fieldErrors: { cover: [metadata.message] } };
    coverBytes = new Uint8Array(await cover.arrayBuffer());
    const image = validateBlogCover(cover, coverBytes);
    if (!image.valid) return { status: "error", message: image.message, fieldErrors: { cover: [image.message] } };
    coverExtension = image.extension;
  }

  const { data: existing, error: lookupError } = await supabase.from("blog_posts")
    .select("id,slug,cover_storage_path,inline_image_paths,updated_at").eq("id", post.id).maybeSingle();
  if (lookupError) return { status: "error", message: "Não foi possível conferir a versão atual do artigo. Tente novamente." };
  if (existing && (!post.updatedAt || post.updatedAt !== existing.updated_at)) {
    return { status: "error", message: staleMessage };
  }
  if (!existing && post.updatedAt) {
    return { status: "error", message: "Este artigo não existe mais. Atualize a página antes de continuar." };
  }

  const removeCover = ["true", "on"].includes(String(formData.get("removeCover")));
  const uploadedPath = cover && coverExtension ? `${post.id}/${randomUUID()}.${coverExtension}` : null;
  const coverPath = uploadedPath ?? (removeCover ? null : existing?.cover_storage_path ?? null);
  if (cover && coverBytes && uploadedPath) {
    const { error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).upload(uploadedPath, coverBytes, {
      contentType: cover.type, cacheControl: "3600", upsert: false,
    });
    if (error) {
      console.error(JSON.stringify({ event: "blog_cover_upload_failed", code: error.name }));
      return { status: "error", message: "Não foi possível enviar a capa. Tente novamente." };
    }
  }
  const cleanup = async (path: string | null) => {
    if (!path) return;
    const { error } = await supabase.storage.from(BLOG_IMAGE_BUCKET).remove([path]);
    if (error) console.error(JSON.stringify({ event: "blog_cover_cleanup_failed", code: error.name }));
  };
  const slug = resolveBlogSlug(post.slug, post.title, post.id);
  const values = {
    title: post.title, slug, excerpt: post.excerpt, content,
    content_format: post.contentFormat, inline_image_paths: inlineImagePaths,
    status: post.status, cover_storage_path: coverPath,
    cover_alt: coverPath ? post.coverAlt || post.title : "", updated_by: admin.id,
  };
  // Never upsert: a stale form cannot recreate a deleted post or bypass its revision check.
  const result = existing
    ? await supabase.from("blog_posts").update(values).eq("id", post.id)
      .eq("updated_at", post.updatedAt).select("id").maybeSingle()
    : await supabase.from("blog_posts").insert({ ...values, id: post.id, created_by: admin.id })
      .select("id").single();
  if (result.error || !result.data) {
    // A transport failure can have an unknown commit outcome. Leave its unreferenced
    // upload private rather than deleting a cover that may have been committed.
    if (!result.error || /^[0-9A-Z]{5}$/.test(result.error.code)) await cleanup(uploadedPath);
    const duplicateSlug = result.error?.code === "23505";
    if (result.error && !duplicateSlug) {
      console.error(JSON.stringify({ event: "blog_save_failed", code: result.error.code }));
    }
    return {
      status: "error",
      message: duplicateSlug ? "Essa URL já está sendo usada. Escolha outra URL para o artigo."
        : !result.error ? staleMessage : "Não foi possível confirmar o salvamento. Atualize a página e confira o artigo antes de tentar novamente.",
      fieldErrors: duplicateSlug ? { slug: ["URL já utilizada."] } : undefined,
    };
  }

  // Cover and inline images can share one immutable file. Only remove references
  // that the committed revision no longer uses, after its concurrency check.
  const retainedImages = new Set([coverPath, ...inlineImagePaths].filter((path): path is string => Boolean(path)));
  const priorImages = new Set([existing?.cover_storage_path, ...(existing?.inline_image_paths ?? [])].filter((path): path is string => Boolean(path)));
  for (const path of priorImages) if (!retainedImages.has(path)) await cleanup(path);
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${post.id}/editar`);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (existing?.slug && existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/sitemap.xml");
  return { status: "success", message: post.status === "published" ? "Artigo publicado no blog." : "Rascunho salvo com sucesso.", postId: post.id };
}
