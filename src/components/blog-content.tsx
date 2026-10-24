import { Fragment, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

import { parseRichTextContent, safeBlogLink, type RichTextDocument, type RichTextNode } from "@/lib/blog/rich-text";

import styles from "./blog-content.module.css";

const allowedElements = [
  "p", "br", "h1", "h2", "h3", "h4", "strong", "em", "a", "ul", "ol", "li",
  "blockquote", "hr", "code", "pre",
];

function safeLink(url: string) {
  return safeBlogLink(url) ?? "";
}

const fontFamilies: Record<string, string> = {
  Montserrat: "var(--font-body), sans-serif",
  Arial: "Arial, sans-serif",
  Georgia: "Georgia, serif",
  "Times New Roman": '"Times New Roman", Times, serif',
};

function richNode(node: RichTextNode, key: string): ReactNode {
  const attrs = node.attrs ?? {};
  const children = node.content?.map((child, index) => richNode(child, `${key}-${index}`));
  if (node.type === "text") {
    let text: ReactNode = node.text;
    for (const [index, mark] of (node.marks ?? []).entries()) {
      const markKey = `${key}-m${index}`;
      if (mark.type === "bold") text = <strong key={markKey}>{text}</strong>;
      else if (mark.type === "italic") text = <em key={markKey}>{text}</em>;
      else if (mark.type === "underline") text = <u key={markKey}>{text}</u>;
      else if (mark.type === "strike") text = <s key={markKey}>{text}</s>;
      else if (mark.type === "code") text = <code key={markKey}>{text}</code>;
      else if (mark.type === "link") {
        const href = String(mark.attrs?.href ?? "");
        const external = /^https?:\/\//i.test(href);
        text = <a key={markKey} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{text}</a>;
      } else if (mark.type === "textStyle") {
        const style: CSSProperties = {};
        if (typeof mark.attrs?.fontFamily === "string") style.fontFamily = fontFamilies[mark.attrs.fontFamily];
        if (typeof mark.attrs?.fontSize === "string") style.fontSize = mark.attrs.fontSize;
        if (typeof mark.attrs?.color === "string") style.color = mark.attrs.color;
        text = <span key={markKey} style={style}>{text}</span>;
      } else if (mark.type === "highlight") text = <mark key={markKey} style={typeof mark.attrs?.color === "string" ? { backgroundColor: mark.attrs.color } : undefined}>{text}</mark>;
    }
    return <Fragment key={key}>{text}</Fragment>;
  }
  const alignment = attrs.textAlign as CSSProperties["textAlign"];
  switch (node.type) {
    case "doc": return <Fragment key={key}>{children}</Fragment>;
    case "paragraph": return <p key={key} style={alignment ? { textAlign: alignment } : undefined}>{children?.length ? children : <br />}</p>;
    case "heading":
      if (attrs.level === 3) return <h3 key={key} style={alignment ? { textAlign: alignment } : undefined}>{children}</h3>;
      if (attrs.level === 4) return <h4 key={key} style={alignment ? { textAlign: alignment } : undefined}>{children}</h4>;
      return <h2 key={key} style={alignment ? { textAlign: alignment } : undefined}>{children}</h2>;
    case "hardBreak": return <br key={key} />;
    case "horizontalRule": return <hr key={key} />;
    case "blockquote": return <blockquote key={key}>{children}</blockquote>;
    case "bulletList": return <ul key={key}>{children}</ul>;
    case "orderedList": return <ol key={key} start={typeof attrs.start === "number" ? attrs.start : undefined}>{children}</ol>;
    case "listItem": return <li key={key}>{children}</li>;
    case "codeBlock": return <pre key={key}><code>{children}</code></pre>;
    case "image": return (
      <figure key={key} className={styles.imageFigure} data-align={attrs.align} style={{ width: `${attrs.width}%` }}>
        <Image className={styles.inlineImage} src={String(attrs.src)} alt={String(attrs.alt ?? "")} width={1600} height={1000} sizes="(max-width: 650px) 100vw, 780px" unoptimized />
        {attrs.title ? <figcaption>{String(attrs.title)}</figcaption> : null}
      </figure>
    );
    case "table": return <div key={key} className={styles.tableScroll} role="region" aria-label="Tabela do artigo" tabIndex={0}><table><tbody>{children}</tbody></table></div>;
    case "tableRow": return <tr key={key}>{children}</tr>;
    case "tableHeader": return <th key={key} scope="col" colSpan={Number(attrs.colspan)} rowSpan={Number(attrs.rowspan)}>{children}</th>;
    case "tableCell": return <td key={key} colSpan={Number(attrs.colspan)} rowSpan={Number(attrs.rowspan)}>{children}</td>;
    default: return null;
  }
}

export function BlogContent({ content, contentFormat = "markdown", allowLocalImages = false }: { content: string; contentFormat?: "markdown" | "richtext"; allowLocalImages?: boolean }) {
  if (contentFormat === "richtext") {
    let document: RichTextDocument;
    try {
      document = parseRichTextContent(content, { allowLocalImages }).document;
    } catch {
      return <p className={styles.content}>Não foi possível apresentar este conteúdo. Revise o artigo no editor.</p>;
    }
    return <div className={styles.content}>{richNode(document, "rich")}</div>;
  }
  return (
    <div className={styles.content}>
      <ReactMarkdown
        skipHtml
        allowedElements={allowedElements}
        unwrapDisallowed
        urlTransform={safeLink}
        components={{
          h1: ({ children }) => <h2>{children}</h2>,
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            const external = /^https?:\/\//i.test(href);
            return (
              <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
