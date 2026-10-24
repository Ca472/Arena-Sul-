"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

import styles from "@/app/admin/admin.module.css";
import { BlogContent } from "@/components/blog-content";
import type { BlogFormState, BlogPost } from "@/lib/blog/types";

import { saveBlogPostAction } from "../actions";
import blogStyles from "../blog-admin.module.css";

const INITIAL_STATE: BlogFormState = { status: "idle", message: "" };
const MAX_COVER_BYTES = 3 * 1024 * 1024;
const COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 160);
}

type Props = { postId: string; initialPost?: BlogPost; demoMode: boolean };

export function BlogForm({ postId, initialPost, demoMode }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialPost?.title));
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [coverAlt, setCoverAlt] = useState(initialPost?.coverAlt ?? "");
  const [removeCover, setRemoveCover] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileError, setFileError] = useState("");
  const [preview, setPreview] = useState(false);
  const [linkEditor, setLinkEditor] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [state, setState] = useState<BlogFormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const contentInput = useRef<HTMLTextAreaElement>(null);
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

  function insertMarkdown(before: string, placeholder: string, after = "", replaceSelected = false) {
    const input = contentInput.current;
    const start = input?.selectionStart ?? content.length;
    const end = input?.selectionEnd ?? content.length;
    const selected = replaceSelected ? placeholder : content.slice(start, end) || placeholder;
    const insertion = `${before}${selected}${after}`;
    if (content.length - (end - start) + insertion.length > 80000) return;
    setContent(`${content.slice(0, start)}${insertion}${content.slice(end)}`);
    setPreview(false);
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  function addLink() {
    const url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url) || /[\s<>]/.test(url)) {
      setLinkError("Informe um endereço completo que comece com https:// ou http://.");
      return;
    }
    const text = (linkText.trim() || "Saiba mais").replace(/[\[\]\\]/g, "");
    insertMarkdown(`[${text}](<`, url, ">)", true);
    setLinkEditor(false);
    setLinkText("");
    setLinkUrl("");
    setLinkError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (demoMode || submitting) return;
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const button = nativeEvent.submitter;
    const nextStatus = button instanceof HTMLButtonElement && button.value === "published" ? "published" : "draft";
    const formData = new FormData(event.currentTarget);
    formData.set("status", nextStatus);
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
      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="updatedAt" value={initialPost?.updatedAt ?? ""} />
      {demoMode ? <p className={`${styles.notice} ${blogStyles.status}`}>Modo de demonstração: você pode escrever e conferir a prévia. Os artigos não são salvos nem publicados neste modo.</p> : null}
      {state.message ? <div className={`${state.status === "error" ? styles.errorNotice : styles.successNotice} ${blogStyles.status}`} role={state.status === "error" ? "alert" : "status"}>{state.message}</div> : null}
      <div className={styles.formGrid}>
        <div className={styles.formStack}>
          <section className={styles.formSection} aria-labelledby="article-info-title">
            <h2 id="article-info-title">Sobre o artigo</h2>
            <div className={styles.field}>
              <label htmlFor="title">Título</label>
              <input id="title" name="title" value={title} maxLength={120} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? "title-error" : undefined} onChange={(event) => { setTitle(event.target.value); if (!slugEdited) setSlug(slugify(event.target.value)); }} placeholder="Qual é o tema do seu artigo?" />
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
              <textarea id="excerpt" name="excerpt" rows={3} value={excerpt} maxLength={240} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.excerpt)} aria-describedby={`excerpt-hint${state.fieldErrors?.excerpt ? " excerpt-error" : ""}`} onChange={(event) => setExcerpt(event.target.value)} placeholder="Apresente o assunto em poucas frases." />
              <div className={blogStyles.counter}><p id="excerpt-hint" className={styles.fieldHint}>Aparece nos cards e na descrição para os buscadores. Para publicar, escreva pelo menos 20 caracteres.</p><span className={styles.fieldHint}>{excerpt.length}/240</span></div>
              {errors("excerpt")}
            </div>
          </section>

          <section className={styles.formSection} aria-labelledby="article-content-title">
            <h2 id="article-content-title">Conteúdo do artigo</h2>
            <div className={blogStyles.tabButtons} aria-label="Visualização do conteúdo"><button type="button" aria-pressed={!preview} aria-controls="content" onClick={() => setPreview(false)}>Escrever</button><button type="button" aria-pressed={preview} aria-controls="content-preview" onClick={() => setPreview(true)}>Prévia</button></div>
            <div className={blogStyles.editor}>
              {!preview ? <div className={blogStyles.editorButtons} aria-label="Formatação do texto"><button type="button" disabled={submitting} onClick={() => insertMarkdown("\n\n## ", "Subtítulo", "\n\n")}>Subtítulo</button><button type="button" disabled={submitting} onClick={() => insertMarkdown("**", "texto em negrito", "**")}><strong>Negrito</strong></button><button type="button" disabled={submitting} onClick={() => insertMarkdown("\n\n- ", "Primeiro item\n- Segundo item", "\n\n")}>Lista</button><button type="button" disabled={submitting} aria-expanded={linkEditor} aria-controls="link-editor" onClick={() => { setLinkEditor(!linkEditor); setLinkText(contentInput.current ? content.slice(contentInput.current.selectionStart, contentInput.current.selectionEnd) : ""); }}>Inserir link</button></div> : null}
              {linkEditor && !preview ? <div id="link-editor" className={blogStyles.linkEditor}><div className={styles.field}><label htmlFor="link-text">Texto do link</label><input id="link-text" value={linkText} onChange={(event) => setLinkText(event.target.value)} disabled={submitting} /></div><div className={styles.field}><label htmlFor="link-url">Endereço do link</label><input id="link-url" type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" disabled={submitting} aria-describedby={linkError ? "link-error" : undefined} />{linkError ? <p id="link-error" className={styles.fieldError}>{linkError}</p> : null}</div><button type="button" className={styles.secondaryButton} disabled={submitting} onClick={addLink}>Adicionar</button></div> : null}
              <label className="sr-only" htmlFor="content">Texto do artigo em Markdown</label>
              <textarea ref={contentInput} id="content" name="content" value={content} maxLength={80000} hidden={preview} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.content)} aria-describedby={`content-hint${state.fieldErrors?.content ? " content-error" : ""}`} onChange={(event) => setContent(event.target.value)} placeholder="Comece a escrever aqui. Use os botões acima para formatar seu artigo." />
              {preview ? <div id="content-preview" className={blogStyles.preview} aria-label="Prévia do conteúdo">{content.trim() ? <BlogContent content={content} /> : <p className={blogStyles.helper}>A prévia do seu texto aparecerá aqui.</p>}</div> : null}
            </div>
            <div className={blogStyles.counter}><p id="content-hint" className={styles.fieldHint}>Os botões inserem formatação Markdown. A prévia mostra o resultado do texto; HTML não é exibido. Para publicar, escreva pelo menos 80 caracteres.</p><span className={styles.fieldHint}>{content.length.toLocaleString("pt-BR")}/80.000</span></div>
            {errors("content")}
          </section>

          <section className={styles.formSection} aria-labelledby="article-cover-title">
            <h2 id="article-cover-title">Imagem de capa <span className={styles.fieldHint}>(opcional)</span></h2>
            {coverSrc ? <div className={blogStyles.cover}><Image src={coverSrc} alt={coverAlt || "Prévia da capa selecionada"} fill sizes="(max-width: 1120px) 100vw, 700px" unoptimized={Boolean(previewUrl)} /></div> : null}
            <div className={styles.field}><label htmlFor="cover">{coverSrc ? "Trocar a capa" : "Escolher uma capa"}</label><input className={blogStyles.coverInput} ref={fileInput} id="cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" disabled={submitting} onChange={selectCover} aria-invalid={Boolean(fileError || state.fieldErrors?.cover)} aria-describedby={`cover-hint${fileError ? " cover-file-error" : ""}${state.fieldErrors?.cover ? " cover-error" : ""}`} /><p id="cover-hint" className={styles.fieldHint}>JPG, PNG ou WebP de até 3 MB. Prefira uma imagem horizontal. A imagem só será enviada quando você salvar o artigo.</p>{fileError ? <><p id="cover-file-error" className={styles.fieldError} role="alert">{fileError}</p><button type="button" className={styles.secondaryButton} onClick={() => setFileError("")}>Continuar sem a nova imagem</button></> : null}{errors("cover")}</div>
            {previewUrl ? <button type="button" className={styles.secondaryButton} onClick={clearSelection} disabled={submitting}>Cancelar nova capa</button> : null}
            {initialPost?.coverStoragePath ? <label className={blogStyles.checkbox}><input name="removeCover" type="checkbox" value="on" checked={removeCover} onChange={(event) => setRemoveCover(event.target.checked)} disabled={submitting || Boolean(previewUrl)} />Remover a capa atual ao salvar</label> : null}
            <div className={styles.field}><label htmlFor="coverAlt">Descrição da imagem</label><input id="coverAlt" name="coverAlt" value={coverAlt} maxLength={240} onChange={(event) => setCoverAlt(event.target.value)} disabled={submitting} aria-invalid={Boolean(state.fieldErrors?.coverAlt)} aria-describedby={`cover-alt-hint${state.fieldErrors?.coverAlt ? " coverAlt-error" : ""}`} placeholder="Descreva o que aparece na foto." /><p id="cover-alt-hint" className={styles.fieldHint}>Ajuda quem usa leitor de tela a compreender a foto.</p>{errors("coverAlt")}</div>
          </section>
        </div>

        <aside className={styles.actionsCard} aria-labelledby="article-publish-title">
          <h2 id="article-publish-title">Publicação</h2>
          <span className={`${styles.badge} ${published ? styles.published : styles.draft}`}>{published ? "Publicado" : "Rascunho"}</span>
          <p>{published ? "Salvar como rascunho retira este artigo do site. Você pode publicá-lo novamente depois." : "Rascunhos ficam apenas no painel. Publique quando o título, o resumo e o texto estiverem prontos."}</p>
          <button className={styles.primaryButton} type="submit" name="status" value="published" disabled={demoMode || submitting || Boolean(fileError)}>{submitting ? "Salvando…" : published ? "Salvar e manter publicado" : "Publicar artigo"}</button>
          <button className={styles.secondaryButton} type="submit" name="status" value="draft" disabled={demoMode || submitting || Boolean(fileError)}>{published ? "Retirar do ar e salvar rascunho" : "Salvar rascunho"}</button>
          {published && initialPost ? <Link className={styles.secondaryButton} href={`/blog/${initialPost.slug}`} target="_blank" rel="noopener noreferrer">Ver artigo publicado ↗</Link> : null}
          <p>O título e o resumo também ajudam a apresentar o artigo nos resultados de busca.</p>
        </aside>
      </div>
    </form>
  );
}
