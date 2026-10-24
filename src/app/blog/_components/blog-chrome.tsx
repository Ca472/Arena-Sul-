import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import styles from "../blog.module.css";

export function BlogHeader() {
  return <div className={styles.header}><SiteHeader /></div>;
}

export function BlogFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`shell ${styles.footerInner}`}>
        <span>© {new Date().getFullYear()} Arena Sul Sports</span>
        <nav className={styles.footerLinks} aria-label="Links do rodapé">
          <Link href="/">Início</Link>
          <Link href="/blog">Blog</Link>
          <a href="https://www.instagram.com/arenasulsports/" target="_blank" rel="noopener noreferrer">Instagram</a>
          <Link href="/privacidade">Privacidade</Link>
          <a href="/admin">Área administrativa</a>
        </nav>
      </div>
    </footer>
  );
}
