import ReactMarkdown from "react-markdown";

import styles from "./blog-content.module.css";

const allowedElements = [
  "p", "br", "h1", "h2", "h3", "h4", "strong", "em", "a", "ul", "ol", "li",
  "blockquote", "hr", "code", "pre",
];

function safeLink(url: string) {
  if (/[\u0000-\u0020\\]/.test(url)) return "";
  if (/^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  if (url.startsWith("#") || (url.startsWith("/") && !url.startsWith("//"))) return url;
  return "";
}

export function BlogContent({ content }: { content: string }) {
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
