/** Shared, dependency-free validation for the editor, Server Actions and public renderer. */
export const BLOG_RICH_TEXT_MAX_SERIALIZED_LENGTH = 300_000;
export const BLOG_RICH_TEXT_MAX_PLAIN_LENGTH = 80_000;
export const BLOG_RICH_TEXT_MAX_IMAGES = 20;
export const BLOG_FONT_FAMILIES = ["Montserrat", "Arial", "Georgia", "Times New Roman"] as const;
export const BLOG_FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"] as const;

type RichTextAttribute = string | number | number[] | null;
export type RichTextMark = { type: string; attrs?: Record<string, RichTextAttribute> };
export type RichTextNode = {
  type: string;
  attrs?: Record<string, RichTextAttribute>;
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
};
export type RichTextDocument = RichTextNode & { type: "doc"; content: RichTextNode[] };
export type ParsedRichTextContent = {
  document: RichTextDocument;
  serialized: string;
  plainText: string;
  imagePaths: string[];
};

export class RichTextValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RichTextValidationError";
  }
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const IMAGE_SOURCE = new RegExp(`^/api/blog/images/(${UUID})/(${UUID}\\.(?:jpg|png|webp))$`, "i");
const COLOR = /^#[0-9a-f]{6}$/i;
const BLOCK_NODES = new Set(["paragraph", "heading", "blockquote", "bulletList", "orderedList", "codeBlock", "horizontalRule", "image", "table"]);
const PLAIN_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);
const TEXT_ALIGNMENTS = new Set(["left", "center", "right", "justify"]);
const IMAGE_ALIGNMENTS = new Set(["left", "center", "right"]);
const IMAGE_WIDTHS = new Set([25, 50, 75, 100]);
const MAX_NODES = 10_000;
const MAX_DEPTH = 24;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function failure(message = "O conteúdo contém uma formatação não reconhecida. Revise o texto no editor."): never {
  throw new RichTextValidationError(message);
}

export function safeBlogLink(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2_048 || /[\u0000-\u0020\u007f\\]/.test(value) || /%(?:00|09|0a|0d|5c)/i.test(value)) return null;
  if (value.startsWith("#")) return value;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^mailto:[^?@]+@[^?@]+(?:\?.*)?$/i.test(value)) return value;
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const url = new URL(value);
    return url.hostname && !url.username && !url.password && ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

export function parseBlogImageSource(value: unknown, postId?: string): { src: string; storagePath: string } | null {
  if (typeof value !== "string") return null;
  const match = IMAGE_SOURCE.exec(value);
  if (!match || (postId && match[1].toLowerCase() !== postId.toLowerCase())) return null;
  const storagePath = `${match[1]}/${match[2]}`.toLowerCase();
  return { src: `/api/blog/images/${storagePath}`, storagePath };
}

function stringAttribute(value: unknown, max: number, message: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) failure(message);
  return value.trim();
}

function textStyle(raw: Record<string, unknown>): Record<string, RichTextAttribute> {
  const attrs: Record<string, RichTextAttribute> = {};
  if (typeof raw.fontFamily === "string") {
    const family = raw.fontFamily.trim().replace(/^['"]|['"]$/g, "");
    const allowed = BLOG_FONT_FAMILIES.find(value => value.toLowerCase() === family.toLowerCase());
    if (allowed) attrs.fontFamily = allowed;
  }
  if (typeof raw.fontSize === "string" && BLOG_FONT_SIZES.includes(raw.fontSize as (typeof BLOG_FONT_SIZES)[number])) attrs.fontSize = raw.fontSize;
  if (typeof raw.color === "string" && COLOR.test(raw.color)) attrs.color = raw.color.toLowerCase();
  return attrs;
}

function normalizeMarks(value: unknown): RichTextMark[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 12) failure();
  const marks: RichTextMark[] = [];
  const seen = new Set<string>();
  for (const mark of value) {
    if (!record(mark) || typeof mark.type !== "string") failure();
    if (seen.has(mark.type)) continue;
    seen.add(mark.type);
    if (PLAIN_MARKS.has(mark.type)) {
      marks.push({ type: mark.type });
    } else if (mark.type === "link") {
      const href = record(mark.attrs) ? safeBlogLink(mark.attrs.href) : null;
      if (!href) failure("Um link do artigo é inválido. Use um endereço http://, https://, e-mail ou link interno.");
      marks.push({ type: "link", attrs: { href } });
    } else if (mark.type === "textStyle") {
      const attrs = textStyle(record(mark.attrs) ? mark.attrs : {});
      if (Object.keys(attrs).length) marks.push({ type: "textStyle", attrs });
    } else if (mark.type === "highlight") {
      const color = record(mark.attrs) ? mark.attrs.color : null;
      marks.push(typeof color === "string" && COLOR.test(color)
        ? { type: "highlight", attrs: { color: color.toLowerCase() } }
        : { type: "highlight" });
    } else failure();
  }
  return marks.length ? marks : undefined;
}

/** Plain text is derived from normalized nodes; image descriptions do not satisfy publication text requirements. */
export function richTextPlainText(document: RichTextNode): string {
  if (document.type === "text") return document.text ?? "";
  if (document.type === "hardBreak") return "\n";
  if (document.type === "image" || document.type === "horizontalRule") return "";
  const separator = ["paragraph", "heading", "codeBlock"].includes(document.type) ? "" : "\n";
  return (document.content ?? []).map(richTextPlainText).join(separator);
}

export function parseRichTextContent(
  raw: string,
  { postId, allowLocalImages = false }: { postId?: string; allowLocalImages?: boolean } = {},
): ParsedRichTextContent {
  if (typeof raw !== "string" || raw.length > BLOG_RICH_TEXT_MAX_SERIALIZED_LENGTH) failure("O conteúdo formatado ultrapassa o limite permitido.");
  let input: unknown;
  try {
    input = raw.trim() ? JSON.parse(raw) : { type: "doc", content: [{ type: "paragraph" }] };
  } catch {
    failure("O conteúdo do editor não pôde ser lido. Revise o artigo antes de salvar.");
  }
  let nodes = 0;
  let imageCount = 0;
  let textLength = 0;
  const imagePaths = new Set<string>();

  function normalize(value: unknown, parent: string, depth: number): RichTextNode {
    if (++nodes > MAX_NODES || depth > MAX_DEPTH) failure("O artigo tem elementos demais ou uma estrutura muito profunda. Simplifique a formatação.");
    if (!record(value) || typeof value.type !== "string") failure();
    const type = value.type;
    const validChild = parent === "root" ? type === "doc"
      : parent === "doc" || parent === "blockquote" || parent === "listItem" || parent === "tableCell" || parent === "tableHeader" ? BLOCK_NODES.has(type)
        : parent === "paragraph" || parent === "heading" ? type === "text" || type === "hardBreak"
          : parent === "bulletList" || parent === "orderedList" ? type === "listItem"
            : parent === "codeBlock" ? type === "text"
              : parent === "table" ? type === "tableRow"
                : parent === "tableRow" ? type === "tableCell" || type === "tableHeader" : false;
    if (!validChild) failure();
    const node: RichTextNode = { type };
    const attrs = record(value.attrs) ? value.attrs : {};
    if (type === "text") {
      if (typeof value.text !== "string" || !value.text.length) failure();
      textLength += value.text.length;
      if (textLength > BLOG_RICH_TEXT_MAX_PLAIN_LENGTH) failure("O texto pode ter até 80 mil caracteres.");
      node.text = value.text;
      const marks = parent === "codeBlock" ? undefined : normalizeMarks(value.marks);
      if (marks) node.marks = marks;
      return node;
    }
    if (type === "image") {
      if (++imageCount > BLOG_RICH_TEXT_MAX_IMAGES) failure("Use no máximo 20 fotos dentro de cada artigo.");
      const source = parseBlogImageSource(attrs.src, postId);
      const localSource = allowLocalImages && typeof attrs.src === "string" && /^blob:https?:\/\/[^\s<>]+$/.test(attrs.src) ? attrs.src : null;
      if (!source && !localSource) failure("Uma foto do artigo não pertence a este conteúdo. Envie a imagem pelo botão Inserir foto.");
      if (source) imagePaths.add(source.storagePath);
      node.attrs = {
        src: source?.src ?? localSource,
        alt: stringAttribute(attrs.alt, 240, "A descrição de cada foto pode ter até 240 caracteres."),
        title: stringAttribute(attrs.title, 500, "A legenda de cada foto pode ter até 500 caracteres."),
        width: typeof attrs.width === "number" && IMAGE_WIDTHS.has(attrs.width) ? attrs.width : 100,
        align: typeof attrs.align === "string" && IMAGE_ALIGNMENTS.has(attrs.align) ? attrs.align : "center",
      };
      return node;
    }
    if (type === "hardBreak" || type === "horizontalRule") return node;
    const normalizedAttrs: Record<string, RichTextAttribute> = {};
    if (type === "paragraph" || type === "heading") {
      if (typeof attrs.textAlign === "string" && TEXT_ALIGNMENTS.has(attrs.textAlign)) normalizedAttrs.textAlign = attrs.textAlign;
      if (type === "heading") normalizedAttrs.level = [2, 3, 4].includes(Number(attrs.level)) ? Number(attrs.level) : 2;
    } else if (type === "orderedList" && typeof attrs.start === "number" && Number.isInteger(attrs.start) && attrs.start >= 1 && attrs.start <= 10_000) {
      normalizedAttrs.start = attrs.start;
    } else if (type === "tableCell" || type === "tableHeader") {
      for (const span of ["colspan", "rowspan"] as const) {
        const size = attrs[span];
        if (size !== undefined && size !== null && (!Number.isInteger(size) || Number(size) < 1 || Number(size) > 20)) failure("A tabela contém células grandes demais. Use até 20 colunas ou linhas combinadas.");
        normalizedAttrs[span] = typeof size === "number" ? size : 1;
      }
      if (Array.isArray(attrs.colwidth) && attrs.colwidth.length <= 20 && attrs.colwidth.every(width => typeof width === "number" && Number.isInteger(width) && width >= 24 && width <= 2_000)) normalizedAttrs.colwidth = attrs.colwidth;
    }
    if (Object.keys(normalizedAttrs).length) node.attrs = normalizedAttrs;
    if (value.content !== undefined && !Array.isArray(value.content)) failure();
    const children = Array.isArray(value.content) ? value.content : [];
    if (["bulletList", "orderedList", "listItem", "table", "tableRow", "tableCell", "tableHeader"].includes(type) && !children.length) failure();
    if ((type === "table" && children.length > 100) || (type === "tableRow" && children.length > 20)) failure("Use tabelas de até 100 linhas e 20 colunas.");
    node.content = children.map(child => normalize(child, type, depth + 1));
    if (type === "listItem" && node.content[0]?.type !== "paragraph") failure();
    return node;
  }

  const document = normalize(input, "root", 0) as RichTextDocument;
  const plainText = richTextPlainText(document).trim();
  if (plainText.length > BLOG_RICH_TEXT_MAX_PLAIN_LENGTH) failure("O texto pode ter até 80 mil caracteres.");
  const serialized = JSON.stringify(document);
  if (serialized.length > BLOG_RICH_TEXT_MAX_SERIALIZED_LENGTH) failure("O conteúdo formatado ultrapassa o limite permitido.");
  return { document, serialized, plainText, imagePaths: [...imagePaths] };
}
