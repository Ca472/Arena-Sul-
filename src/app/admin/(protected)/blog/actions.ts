"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getAdminIdentity } from "@/lib/auth/admin";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BLOG_IMAGE_BUCKET, blogPostSchema, resolveBlogSlug, validateBlogCover } from "@/lib/blog/validation";
import type { BlogFormState } from "@/lib/blog/types";

const staleMessage = "Este artigo foi alterado em outra janela. Atualize a página antes de salvar novamente.";

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
    status: formData.get("status"),
    coverAlt: formData.get("coverAlt") ?? "",
    updatedAt: formData.get("updatedAt") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados antes de salvar.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const post = parsed.data;
  const coverEntry = formData.get("cover");
  if (typeof coverEntry === "string") {
    return { status: "error", message: "Selecione uma imagem para a capa.", fieldErrors: { cover: ["Arquivo de imagem inválido."] } };
  }
  const cover = coverEntry && (coverEntry.size > 0 || coverEntry.name) ? coverEntry : null;
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
    .select("id,slug,cover_storage_path,updated_at").eq("id", post.id).maybeSingle();
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
    title: post.title, slug, excerpt: post.excerpt, content: post.content,
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

  if (existing?.cover_storage_path && existing.cover_storage_path !== coverPath) {
    await cleanup(existing.cover_storage_path);
  }
  revalidatePath("/admin/blog");
  revalidatePath(`/admin/blog/${post.id}/editar`);
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  if (existing?.slug && existing.slug !== slug) revalidatePath(`/blog/${existing.slug}`);
  revalidatePath("/sitemap.xml");
  return { status: "success", message: post.status === "published" ? "Artigo publicado no blog." : "Rascunho salvo com sucesso.", postId: post.id };
}
