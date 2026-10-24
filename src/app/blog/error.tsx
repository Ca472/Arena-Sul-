"use client";

import { BlogFooter, BlogHeader } from "./_components/blog-chrome";
import styles from "./blog.module.css";

export default function BlogError({ reset }: { reset: () => void }) {
  return (
    <main className={`public-site ${styles.page}`}>
      <BlogHeader />
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Blog da Arena</p>
          <h1>Vamos tentar de novo.</h1>
          <p>Não foi possível carregar os artigos agora. Tente novamente em alguns instantes.</p>
          <button className={styles.articleCta} type="button" onClick={reset}>Tentar novamente <span aria-hidden="true">↻</span></button>
        </div>
      </section>
      <BlogFooter />
    </main>
  );
}
