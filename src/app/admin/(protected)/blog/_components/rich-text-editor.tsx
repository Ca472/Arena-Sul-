"use client";

import ImageExtension from "@tiptap/extension-image";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor, useEditorState, type NodeViewProps } from "@tiptap/react";
import { TextSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BLOG_FONT_FAMILIES, BLOG_FONT_SIZES, parseRichTextContent, safeBlogLink } from "@/lib/blog/rich-text";

import { uploadBlogInlineImageAction } from "../actions";
import styles from "./rich-text-editor.module.css";

const EMPTY_DOCUMENT = { type: "doc", content: [{ type: "paragraph" }] };
const IMAGE_LIMIT = 20;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const INTERNAL_IMAGE = /^\/api\/blog\/images\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i;

function BlogImageView({ node, selected, editor, getPos }: NodeViewProps) {
  const width = typeof node.attrs.width === "number" ? node.attrs.width : 100;
  const align = node.attrs.align === "left" || node.attrs.align === "right" ? node.attrs.align : "center";
  function selectImage() {
    const position = getPos();
    if (typeof position === "number") editor.chain().focus().setNodeSelection(position).run();
  }
  return (
    <NodeViewWrapper
      as="figure"
      className={`${styles.imageNode} ${selected ? styles.imageSelected : ""}`}
      data-align={align}
      data-drag-handle
      style={{ width: `${width}%` }}
      contentEditable={false}
      role="button"
      tabIndex={0}
      aria-label={`Selecionar foto${node.attrs.alt ? `: ${node.attrs.alt}` : " para editar descrição e legenda"}`}
      onClick={selectImage}
      onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectImage(); } }}
    >
      {/* Draft images need the browser session cookie, so they bypass next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={node.attrs.src} alt={node.attrs.alt || ""} draggable />
      {node.attrs.title ? <figcaption>{node.attrs.title}</figcaption> : null}
    </NodeViewWrapper>
  );
}

const BlogImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: 100, parseHTML: (element) => Number(element.getAttribute("data-width")) || 100, renderHTML: ({ width }) => ({ "data-width": width, style: `width: ${width}%;` }) },
      align: { default: "center", parseHTML: (element) => element.getAttribute("data-align") || "center", renderHTML: ({ align }) => ({ "data-align": align }) },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]", getAttrs: (element) => {
      const source = element.getAttribute("src") || "";
      return INTERNAL_IMAGE.test(source) || source.startsWith("blob:") ? null : false;
    } }];
  },
  addNodeView() { return ReactNodeViewRenderer(BlogImageView); },
});

type Props = {
  postId: string;
  initialContent: string;
  demoMode: boolean;
  disabled: boolean;
  invalid?: boolean;
  describedBy?: string;
  onChange: (content: string, plainText: string) => void;
  onUploadingChange: (uploading: boolean) => void;
};

type ToolButtonProps = {
  children: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolButton({ children, label, active, disabled, onClick }: ToolButtonProps) {
  return <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick}>{children}</button>;
}

export function RichTextEditor({ postId, initialContent, demoMode, disabled, invalid, describedBy, onChange, onUploadingChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [error, setError] = useState("");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const localImages = useRef<string[]>([]);
  const uploadHandler = useRef<(files: File[]) => void>(() => {});
  const linkRange = useRef({ from: 0, to: 0 });
  const initialDocument = useMemo(() => {
    if (!initialContent) return EMPTY_DOCUMENT;
    return parseRichTextContent(initialContent, { postId, allowLocalImages: demoMode }).document;
  }, [initialContent, postId, demoMode]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: false, linkOnPaste: false } }),
      TextStyleKit.configure({ backgroundColor: false, lineHeight: false }),
      TextAlign.configure({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"] }),
      Highlight.configure({ multicolor: true }),
      BlogImage.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Escreva seu artigo aqui. Use as ferramentas acima para formatar e inserir fotos." }),
    ],
    content: initialDocument,
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: { class: styles.prose, role: "textbox", "aria-label": "Texto do artigo", "aria-multiline": "true", "aria-invalid": String(Boolean(invalid)), ...(describedBy ? { "aria-describedby": describedBy } : {}) },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (!files.length) return false;
        uploadHandler.current(files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (moved || !files.length) return false;
        const position = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (position) view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(position.pos))));
        uploadHandler.current(files);
        return true;
      },
    },
    onUpdate: ({ editor: current }) => onChange(JSON.stringify(current.getJSON()), current.getText({ blockSeparator: "\n" })),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return null;
      const image = current.isActive("image") ? current.getAttributes("image") : null;
      let imageCount = 0;
      let tableRows = 0;
      let tableColumns = 0;
      current.state.doc.descendants((node) => { if (node.type.name === "image") imageCount++; });
      const { $from } = current.state.selection;
      for (let depth = $from.depth; depth >= 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === "table") { tableRows = node.childCount; tableColumns = node.firstChild?.childCount ?? 0; break; }
      }
      return {
        bold: current.isActive("bold"), italic: current.isActive("italic"), underline: current.isActive("underline"), strike: current.isActive("strike"), highlight: current.isActive("highlight"),
        bullet: current.isActive("bulletList"), ordered: current.isActive("orderedList"), quote: current.isActive("blockquote"), link: current.isActive("link"), table: current.isActive("table"),
        font: String(current.getAttributes("textStyle").fontFamily || ""), size: String(current.getAttributes("textStyle").fontSize || ""), color: String(current.getAttributes("textStyle").color || "#16352d"), highlightColor: String(current.getAttributes("highlight").color || "#fff3a3"),
        block: current.isActive("heading") ? String(current.getAttributes("heading").level) : "paragraph", align: String(current.getAttributes(current.isActive("heading") ? "heading" : "paragraph").textAlign || "left"),
        image: image ? { alt: String(image.alt || ""), title: String(image.title || ""), width: Number(image.width) || 100, align: String(image.align || "center") } : null,
        imageCount, tableRows, tableColumns, canUndo: current.can().undo(), canRedo: current.can().redo(),
      };
    },
  });
  const toolsDisabled = disabled || uploading || !editor;

  useEffect(() => { editor?.setEditable(!disabled && !uploading); }, [editor, disabled, uploading]);
  useEffect(() => () => { localImages.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!editor || disabled || uploadingRef.current || !files.length) return;
    let imageCount = 0;
    editor.state.doc.descendants((node) => { if (node.type.name === "image") imageCount++; });
    if (imageCount + files.length > IMAGE_LIMIT) { setError("Cada artigo pode ter até 20 fotos no texto. Remova uma foto antes de adicionar outras."); return; }
    const invalidFile = files.find((file) => !IMAGE_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_IMAGE_BYTES);
    if (invalidFile) { setError(`A foto “${invalidFile.name}” precisa ser JPG, PNG ou WebP de até 3 MB.`); return; }
    uploadingRef.current = true;
    setUploading(true);
    onUploadingChange(true);
    setError("");
    let inserted = 0;
    try {
      for (const [index, file] of files.entries()) {
        setUploadMessage(`${demoMode ? "Preparando" : "Enviando"} foto ${index + 1} de ${files.length}…`);
        let source: string;
        if (demoMode) { source = URL.createObjectURL(file); localImages.current.push(source); }
        else {
          const data = new FormData(); data.set("postId", postId); data.set("file", file);
          const result = await uploadBlogInlineImageAction(data);
          if (result.status !== "success" || !result.src) throw new Error(result.message || "Não foi possível enviar esta foto.");
          source = result.src;
        }
        editor.chain().focus().insertContent([{ type: "image", attrs: { src: source, alt: "", title: "", width: 100, align: "center" } }, { type: "paragraph" }]).run();
        inserted++;
      }
      setUploadMessage(`${inserted} foto${inserted === 1 ? " inserida" : "s inseridas"}. Selecione uma foto para editar a descrição, a legenda e o tamanho.${demoMode ? " Esta é uma prévia local; nenhum arquivo foi enviado." : " Salve o artigo para guardar as alterações."}`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Não foi possível enviar as fotos agora. Tente novamente.");
      setUploadMessage(inserted ? `${inserted} foto${inserted === 1 ? " foi inserida" : "s foram inseridas"} antes da interrupção.` : "");
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      onUploadingChange(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }, [editor, disabled, demoMode, postId, onUploadingChange]);
  useEffect(() => { uploadHandler.current = (files) => { void uploadFiles(files); }; }, [uploadFiles]);

  function openLink() {
    if (!editor) return;
    if (editor.isActive("link")) editor.chain().focus().extendMarkRange("link").run();
    const { from, to } = editor.state.selection;
    linkRange.current = { from, to };
    setLinkText(editor.state.doc.textBetween(from, to, " "));
    setLinkUrl(String(editor.getAttributes("link").href || ""));
    setError("");
    setLinkOpen(true);
  }

  function applyLink() {
    if (!editor) return;
    const url = safeBlogLink(linkUrl.trim());
    if (!url) { setError("Use um link completo com https://, um e-mail com mailto: ou um endereço interno começando por /."); return; }
    const range = linkRange.current;
    const selectedText = editor.state.doc.textBetween(range.from, range.to, " ");
    if (range.from === range.to || linkText.trim() !== selectedText) editor.chain().focus().setTextSelection(range).insertContent({ type: "text", text: linkText.trim() || url, marks: [{ type: "link", attrs: { href: url } }] }).run();
    else editor.chain().focus().setTextSelection(range).setLink({ href: url }).run();
    setLinkOpen(false);
    setError("");
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void uploadFiles(files);
  }

  return (
    <div className={`${styles.editor} ${invalid ? styles.invalid : ""}`}>
      <div className={styles.toolbar} aria-label="Ferramentas de edição do artigo">
        <div className={styles.selectors}>
          <label>Estilo<select value={state?.block ?? "paragraph"} disabled={toolsDisabled} onChange={(event) => { const level = Number(event.target.value); if (level === 2 || level === 3 || level === 4) editor?.chain().focus().setHeading({ level }).run(); else editor?.chain().focus().setParagraph().run(); }}><option value="paragraph">Parágrafo</option><option value="2">Título 2</option><option value="3">Título 3</option><option value="4">Título 4</option></select></label>
          <label>Fonte<select value={BLOG_FONT_FAMILIES.includes(state?.font as typeof BLOG_FONT_FAMILIES[number]) ? state?.font : ""} disabled={toolsDisabled} onChange={(event) => { if (event.target.value) editor?.chain().focus().setFontFamily(event.target.value).run(); else editor?.chain().focus().unsetFontFamily().run(); }}><option value="">Padrão da Arena</option>{BLOG_FONT_FAMILIES.map((font) => <option value={font} key={font}>{font}</option>)}</select></label>
          <label>Tamanho<select value={BLOG_FONT_SIZES.includes(state?.size as typeof BLOG_FONT_SIZES[number]) ? state?.size : ""} disabled={toolsDisabled} onChange={(event) => { if (event.target.value) editor?.chain().focus().setFontSize(event.target.value).run(); else editor?.chain().focus().unsetFontSize().run(); }}><option value="">Padrão</option>{BLOG_FONT_SIZES.map((size) => <option value={size} key={size}>{size.replace("px", "")} px</option>)}</select></label>
          <label className={styles.colorControl}>Cor<input type="color" aria-label="Cor do texto" value={/^#[0-9a-f]{6}$/i.test(state?.color || "") ? state?.color : "#16352d"} disabled={toolsDisabled} onChange={(event) => editor?.chain().focus().setColor(event.target.value).run()} /></label>
          <label className={styles.colorControl}>Realce<input type="color" aria-label="Cor de realce" value={/^#[0-9a-f]{6}$/i.test(state?.highlightColor || "") ? state?.highlightColor : "#fff3a3"} disabled={toolsDisabled} onChange={(event) => editor?.chain().focus().setHighlight({ color: event.target.value }).run()} /></label>
        </div>
        <div className={styles.tools}>
          <ToolButton label="Negrito" active={state?.bold} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleBold().run(); }}><strong>N</strong></ToolButton>
          <ToolButton label="Itálico" active={state?.italic} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleItalic().run(); }}><em>I</em></ToolButton>
          <ToolButton label="Sublinhado" active={state?.underline} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleUnderline().run(); }}><u>S</u></ToolButton>
          <ToolButton label="Riscado" active={state?.strike} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleStrike().run(); }}><s>R</s></ToolButton>
          <ToolButton label="Realçar texto" active={state?.highlight} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleHighlight({ color: state?.highlightColor || "#fff3a3" }).run(); }}>Realçar</ToolButton>
          <ToolButton label="Lista com marcadores" active={state?.bullet} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleBulletList().run(); }}>• Lista</ToolButton>
          <ToolButton label="Lista numerada" active={state?.ordered} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleOrderedList().run(); }}>1. Lista</ToolButton>
          <ToolButton label="Alinhar à esquerda" active={state?.align === "left"} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setTextAlign("left").run(); }}>Esquerda</ToolButton>
          <ToolButton label="Centralizar texto" active={state?.align === "center"} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setTextAlign("center").run(); }}>Centro</ToolButton>
          <ToolButton label="Alinhar à direita" active={state?.align === "right"} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setTextAlign("right").run(); }}>Direita</ToolButton>
          <ToolButton label="Justificar texto" active={state?.align === "justify"} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setTextAlign("justify").run(); }}>Justificar</ToolButton>
        </div>
        <div className={styles.tools}>
          <ToolButton label={state?.link ? "Editar link" : "Inserir link"} active={state?.link} disabled={toolsDisabled} onClick={openLink}>Link</ToolButton>
          <ToolButton label="Inserir fotos no artigo" disabled={toolsDisabled || (state?.imageCount ?? 0) >= IMAGE_LIMIT} onClick={() => fileInput.current?.click()}>＋ Fotos</ToolButton>
          <ToolButton label="Inserir tabela de três linhas e três colunas" active={state?.table} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }}>Tabela</ToolButton>
          <ToolButton label="Citação" active={state?.quote} disabled={toolsDisabled} onClick={() => { editor?.chain().focus().toggleBlockquote().run(); }}>“ Citação</ToolButton>
          <ToolButton label="Inserir linha divisória" disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setHorizontalRule().run(); }}>Divisor</ToolButton>
          <ToolButton label="Desfazer" disabled={toolsDisabled || !state?.canUndo} onClick={() => { editor?.chain().focus().undo().run(); }}>↶ Desfazer</ToolButton>
          <ToolButton label="Refazer" disabled={toolsDisabled || !state?.canRedo} onClick={() => { editor?.chain().focus().redo().run(); }}>↷ Refazer</ToolButton>
          <ToolButton label="Limpar formatação do texto selecionado" disabled={toolsDisabled} onClick={() => { editor?.chain().focus().unsetAllMarks().clearNodes().run(); }}>Limpar formato</ToolButton>
        </div>
      </div>
      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={selectFiles} />
      {linkOpen ? <div className={styles.contextPanel} aria-label="Editar link"><label>Texto do link<input value={linkText} maxLength={500} onChange={(event) => setLinkText(event.target.value)} disabled={toolsDisabled} /></label><label>Endereço do link<input value={linkUrl} maxLength={2000} onChange={(event) => setLinkUrl(event.target.value)} disabled={toolsDisabled} placeholder="https://" /></label><div className={styles.tools}><button type="button" disabled={toolsDisabled} onClick={applyLink}>Aplicar link</button><button type="button" disabled={toolsDisabled} onClick={() => { editor?.chain().focus().setTextSelection(linkRange.current).unsetLink().run(); setLinkOpen(false); }}>Remover link</button><button type="button" onClick={() => { setLinkOpen(false); setError(""); }}>Cancelar</button></div></div> : null}
      {state?.table ? <div className={`${styles.contextPanel} ${styles.tablePanel}`} aria-label="Ferramentas da tabela"><strong>Tabela selecionada</strong><div className={styles.tools}><button type="button" disabled={toolsDisabled || state.tableRows >= 20} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().addRowAfter().run()}>＋ Linha</button><button type="button" disabled={toolsDisabled || state.tableColumns >= 10} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().addColumnAfter().run()}>＋ Coluna</button><button type="button" disabled={toolsDisabled} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().deleteRow().run()}>Excluir linha</button><button type="button" disabled={toolsDisabled} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().deleteColumn().run()}>Excluir coluna</button><button type="button" disabled={toolsDisabled} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().deleteTable().run()}>Remover tabela</button></div></div> : null}
      {state?.image ? <div className={styles.contextPanel} aria-label="Editar foto selecionada"><strong>Foto selecionada</strong><p>Descreva a foto para leitores de tela e adicione uma legenda, se desejar.</p><label>Descrição da foto<input value={state.image.alt} maxLength={240} onChange={(event) => editor?.commands.updateAttributes("image", { alt: event.target.value })} disabled={toolsDisabled} /></label><label>Legenda da foto<input value={state.image.title} maxLength={240} onChange={(event) => editor?.commands.updateAttributes("image", { title: event.target.value })} disabled={toolsDisabled} /></label><div className={styles.imageOptions}><label>Largura da foto<select value={state.image.width} disabled={toolsDisabled} onChange={(event) => editor?.commands.updateAttributes("image", { width: Number(event.target.value) })}>{[25, 50, 75, 100].map((width) => <option key={width} value={width}>{width}% do texto</option>)}</select></label><label>Alinhamento da foto<select value={state.image.align} disabled={toolsDisabled} onChange={(event) => editor?.commands.updateAttributes("image", { align: event.target.value })}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><button type="button" disabled={toolsDisabled} onMouseDown={(event) => event.preventDefault()} onClick={() => editor?.chain().focus().deleteSelection().run()}>Remover foto</button></div></div> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      {uploadMessage ? <p className={styles.uploadStatus} role="status" aria-live="polite">{uploadMessage}</p> : null}
      {editor ? <EditorContent editor={editor} className={styles.content} /> : <p className={styles.loading} role="status">Carregando editor…</p>}
      <div className={styles.editorFoot}><span>Você pode arrastar ou colar fotos no texto. JPG, PNG ou WebP, até 3 MB por foto.</span><span>{state?.imageCount ?? 0}/20 fotos</span></div>
    </div>
  );
}
