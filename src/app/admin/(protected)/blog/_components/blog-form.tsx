"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import styles from "@/app/admin/admin.module.css";
import { BlogContent } from "@/components/blog-content";
import type { BlogFormState, BlogPost } from "@/lib/blog/types";
import { parseRichTextContent } from "@/lib/blog/rich-text";
import { AdminIcon } from "@/components/admin/admin-icon";

import { saveBlogPostAction } from "../actions";
import blogStyles from "../blog-admin.module.css";

const INITIAL_STATE: BlogFormState = { status: "idle", message: "" };
const MAX_COVER_BYTES = 3 * 1024 * 1024;
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const EMPTY_RICH_CONTENT = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
const RichTextEditor = dynamic(() => import("./rich-text-editor").then((module) => module.RichTextEditor), {
  ssr: false,
  loading: () => <p className={blogStyles.helper}>Carregando ferramentas de edição…</p>,
});

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}

type Props = { postId: string; initialPost?: BlogPost; demoMode: boolean };

export function BlogForm({ postId, initialPost, demoMode }: Props) {
  const router = useRouter();
  const [articleId] = useState(postId);
  const contentFormat = initialPost?.contentFormat ?? (initialPost ? "markdown" : "richtext");
  const initialContent = initialPost?.content ?? EMPTY_RICH_CONTENT;
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialPost?.title));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [content, setContent] = useState(initialContent);
  const [plainText, setPlainText] = useState(() => contentFormat === "richtext" ? parseRichTextContent(initialContent).plainText : initialContent);
  const [coverAlt, setCoverAlt] = useState(initialPost?.coverAlt ?? "");
  const [removeCover, setRemoveCover] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [state, setState] = useState<BlogFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef("");
  const coverSrc = previewUrl || (!removeCover ? initialPost?.coverUrl : null);
  const published = initialPost?.status === "published";

  useEffect(() => () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); }, []);

  function clearSelection() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPreviewUrl("");
    if (fileInput.current) fileInput.current.value = "";
  }

  function selectCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!COVER_TYPES.has(file.type) || file.size > MAX_COVER_BYTES) {
      clearSelection();
      setFileError("Selecione uma imagem JPG, PNG ou WebP de até 3 MB.");
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreviewUrl(url);
    setRemoveCover(false);
    setFileError("");
  }

  const updateRichContent = useCallback((value: string, text: string) => { setContent(value); setPlainText(text); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demoMode || submitting || uploadingImages) return;
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const button = nativeEvent.submitter;
    const nextStatus = button instanceof HTMLButtonElement && button.value === "published" ? "published" : "draft";
    const formData = new FormData(event.currentTarget);
    if (!fileInput.current?.files?.length) formData.delete("cover");
    formData.set("status", nextStatus);
    formData.set("content", content);
    formData.set("contentFormat", contentFormat);
    setSubmitting(true);
    setState(INITIAL_STATE);
    try {
      const result = await saveBlogPostAction(INITIAL_STATE, formData);
      setState(result);
      if (result.status === "success" && result.postId) {
        clearSelection();
        setRemoveCover(false);
        router.replace(`/admin/blog/${result.postId}/editar`, { scroll: false });
        router.refresh();
      }
    } catch {
      setState({ status: "error", message: "Não foi possível salvar agora. Seu texto continua no editor; tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  function errors(name: string) {
    const messages = state.fieldErrors?.[name];
    return messages?.length ? <p className={styles.fieldError} id={`${name}-error`}>{messages.join(" ")}</p> : null;
  }

  return (
    <form className={blogStyles.form} onSubmit={submit} aria-busy={submitting}>
      <input type="hidden" name="id" value={articleId} />
      <input type="hidden" name="updatedAt" value={initialPost?.updatedAt ?? ""} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="contentFormat" value={contentFormat} />
      {demoMode ? <p className={`${styles.notice} ${blogStyles.status}`}>Modo de demonstração: você pode escrever e conferir a prévia. Os artigos não são salvos nem publicados neste modo.</p> : null}
      {state.message ? <div className={`${state.status === "error" ? styles.errorNotice : styles.successNotice} ${blogStyles.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</div> : null}
      <div className={styles.formGrid}>
        <div className={styles.formStack}>
          <section className={styles.formSection} aria-labelledby="article-info-title">
            <div className={blogStyles.sectionHeading}>
              <div className={blogStyles.sectionTitle}><span className={blogStyles.sectionIcon}><AdminIcon name="file-text" /></span><h2 id="article-info-title">Sobre o artigo</h2></div>
            </div>
            <div className={styles.field}>
              <label htmlFor="title">Título</label>
              <input className={blogStyles.titleInput} id="title" name="title" value={title} maxLength={120} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? "title-error" : undefined} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} placeholder="Qual é o tema do seu artigo?" />
              {errors("title")}
            </div>
            <div className={styles.field}>
              <label htmlFor="slug">Endereço do artigo</label>
              <input id="slug" name="slug" value={slug} maxLength={160} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.slug)} aria-describedby={`slug-hint${state.fieldErrors?.slug ? " slug-error" : ""}`} onChange={(event) => { setSlug(event.target.value.toLowerCase()); setSlugEdited(true); }} />
              <p id="slug-hint" className={styles.fieldHint}>/blog/{slug || "seu-artigo"} · Use letras minúsculas, números e hífens. Alterar um endereço publicado muda o link do artigo.</p>
              {errors("slug")}
            </div>
            <div className={styles.field}>
              <label htmlFor="excerpt">Resumo</label>
              <textarea className={blogStyles.excerptInput} id="excerpt" name="excerpt" rows={3} value={excerpt} maxLength={240} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.excerpt)} aria-describedby={`excerpt-hint${state.fieldErrors?.excerpt ? " excerpt-error" : ""}`} onChange={(event) => setExcerpt(event.target.value)} placeholder="Apresente o assunto em poucas frases." />
              <div className={blogStyles.counter}><p id="excerpt-hint" className={styles.fieldHint}>Descrição exibida nos cards e nos buscadores. Mínimo de 20 caracteres para publicar.</p><span className={styles.fieldHint}>{excerpt.length}/240</span></div>
              {errors("excerpt")}
            </div>
          </section>

          <section className={styles.formSection} aria-labelledby="article-content-title">
            <div className={blogStyles.sectionHeading}>
              <div className={blogStyles.sectionTitle}><span className={blogStyles.sectionIcon}><AdminIcon name="pen" /></span><h2 id="article-content-title">Conteúdo do artigo</h2></div>
              <div className={blogStyles.tabButtons} aria-label="Visualização do conteúdo">
                <button type="button" aria-pressed={!preview} aria-controls="article-editor" disabled={submitting || uploadingImages} onClick={() => setPreview(false)}><AdminIcon name="edit" size={15} />Escrever</button>
                <button type="button" aria-pressed={preview} aria-controls="content-preview" disabled={submitting || uploadingImages} onClick={() => setPreview(true)}><AdminIcon name="eye" size={15} />Prévia</button>
              </div>
            </div>
            <div id="article-editor" className={blogStyles.visualEditor} hidden={preview}>
              {contentFormat === "richtext" ? (
                <RichTextEditor postId={articleId} initialContent={initialContent} demoMode={demoMode} disabled={submitting} invalid={Boolean(state.fieldErrors?.content)} describedBy={`content-hint${state.fieldErrors?.content ? " content-error" : ""}`} onChange={updateRichContent} onUploadingChange={setUploadingImages} />
              ) : (
                <div className={blogStyles.editor}>
                  <p className={blogStyles.legacyNotice}>Este artigo usa o formato de texto anterior. A edição abaixo preserva a formatação original.</p>
                  <label className="sr-only" htmlFor="legacy-content">Texto do artigo no formato anterior</label>
                  <textarea id="legacy-content" value={content} maxLength={80000} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.content)} aria-describedby={`content-hint${state.fieldErrors?.content ? " content-error" : ""}`} onChange={(event) => { setContent(event.target.value); setPlainText(event.target.value); }} />
                </div>
              )}
            </div>
            {preview ? <div id="content-preview" className={blogStyles.preview} aria-label="Prévia do artigo">{plainText.trim() || contentFormat === "richtext" ? <BlogContent content={content} contentFormat={contentFormat} allowLocalImages={demoMode} /> : <p className={blogStyles.helper}>A prévia do seu texto aparecerá aqui.</p>}</div> : null}
            <div className={blogStyles.counter}>
              <p id="content-hint" className={styles.fieldHint}>{contentFormat === "richtext" ? "Mínimo de 80 caracteres para publicar. Salve o rascunho antes de sair." : "A prévia mostra a formatação do texto. Mínimo de 80 caracteres para publicar."}</p>
              <span className={`${styles.fieldHint} ${plainText.length > 80000 ? blogStyles.overLimit : ""}`}>{plainText.trim() ? plainText.trim().split(/\s+/).length.toLocaleString("pt-BR") : "0"} palavras · {plainText.length.toLocaleString("pt-BR")}/80.000</span>
            </div>
            {errors("content")}
          </section>
          <section className={styles.formSection} aria-labelledby="article-cover-title">
            <div className={blogStyles.sectionHeading}><div className={blogStyles.sectionTitle}><span className={blogStyles.sectionIcon}><AdminIcon name="image" /></span><h2 id="article-cover-title">Imagem de capa <span className={blogStyles.optionalLabel}>Opcional</span></h2></div></div>
            {coverSrc ? <div className={blogStyles.cover}><Image src={coverSrc} alt={coverAlt || "Prévia da capa selecionada"} fill sizes="(max-width: 1120px) 100vw, 700px" unoptimized={Boolean(previewUrl)} /></div> : null}
            <div className={styles.field}><label htmlFor="cover">{coverSrc ? "Trocar a capa" : "Escolher uma capa"}</label><input className={blogStyles.coverInput} ref={fileInput} id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" disabled={submitting} onChange={selectCover} aria-invalid={Boolean(fileError || state.fieldErrors?.cover)} aria-describedby={`cover-hint${fileError ? " cover-file-error" : ""}${state.fieldErrors?.cover ? " cover-error" : ""}`} /><p id="cover-hint" className={styles.fieldHint}>JPG, PNG ou WebP de até 3 MB. Prefira uma imagem horizontal. A imagem só será enviada quando você salvar o artigo.</p>{fileError ? <><p id="cover-file-error" className={styles.fieldError} role="alert">{fileError}</p><button type="button" className={styles.secondaryButton} onClick={() => setFileError("")}>Continuar sem a nova imagem</button></> : null}{errors("cover")}</div>
            {previewUrl ? <button type="button" className={styles.secondaryButton} onClick={clearSelection} disabled={submitting}>Cancelar nova capa</button> : null}
            {initialPost?.coverStoragePath ? <label className={blogStyles.checkbox}><input name="removeCover" type="checkbox" value="on" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} disabled={submitting || Boolean(previewUrl)} />Remover a capa atual ao salvar</label> : null}
            <div className={styles.field}><label htmlFor="coverAlt">Descrição da imagem</label><input id="coverAlt" name="coverAlt" value={coverAlt} maxLength={240} onChange={(event) => setCoverAlt(event.target.value)} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.coverAlt)} aria-describedby={`cover-alt-hint${state.fieldErrors?.coverAlt ? " coverAlt-error" : ""}`} placeholder="Descreva o que aparece na foto." /><p id="cover-alt-hint" className={styles.fieldHint}>Ajuda quem usa leitor de tela a compreender a foto.</p>{errors("coverAlt")}</div>
          </section>
        </div>

        <aside className={`${styles.actionsCard} ${blogStyles.publicationCard}`} aria-labelledby="article-publish-title">
          <div className={blogStyles.publicationHeading}><span className={blogStyles.publicationIcon}><AdminIcon name="check" size={20} /></span><h2 id="article-publish-title">Publicação</h2></div>
          <div className={blogStyles.publicationStatus}>
            <span className={`${styles.badge} ${published ? styles.published : styles.draft}`}><AdminIcon name={published ? "check" : "clock"} size={14} />{published ? "Publicado" : "Rascunho"}</span>
            <p>{published ? "Seu artigo está no site. Salvar como rascunho retira o conteúdo do ar." : "Visível apenas no painel. Revise o conteúdo antes de publicar."}</p>
          </div>
          <button className={styles.primaryButton} type="submit" name="status" value="published" disabled={demoMode || submitting || uploadingImages || Boolean(fileError)}><AdminIcon name="check" size={17} />{uploadingImages ? "Aguarde as fotos…" : submitting ? "Salvando…" : published ? "Salvar e manter publicado" : "Publicar artigo"}</button>
          <button className={styles.secondaryButton} type="submit" name="status" value="draft" disabled={demoMode || submitting || uploadingImages || Boolean(fileError)}><AdminIcon name="file-text" size={17} />{published ? "Retirar do ar e salvar rascunho" : "Salvar rascunho"}</button>
          {published && initialPost ? <Link className={styles.secondaryButton} href={`/blog/${initialPost.slug}`} target="_blank" rel="noopener noreferrer"><AdminIcon name="external" size={16} />Ver artigo publicado</Link> : null}
          <div className={blogStyles.publicationNote}><AdminIcon name="type" size={16} /><p>O título e o resumo apresentam o artigo nos resultados de busca.</p></div>
        </aside>
      </div>
    </form>
  );
}
