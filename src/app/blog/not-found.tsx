import Link from "next/link";

import { BlogFooter, BlogHeader } from "./_components/blog-chrome";
import styles from "./blog.module.css";

export default function BlogNotFound() {
  return (
    <main className={`public-site ${styles.page}`}>
      <BlogHeader />
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Blog da Arena</p>
          <h1>Artigo não encontrado.</h1>
          <p>Este conteúdo pode ter mudado de endereço ou ainda não estar publicado.</p>
          <Link className={styles.articleCta} href="/blog">Voltar ao blog <span aria-hidden="true">→</span></Link>
        </div>
      </section>
      <BlogFooter />
    </main>
  );
}
