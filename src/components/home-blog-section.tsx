import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import type { BlogPostSummary } from "@/lib/blog/types";

import styles from "./home-blog-section.module.css";

type HomeBlogSectionProps = {
  posts: BlogPostSummary[];
  state?: "ready" | "loading" | "unavailable";
};

const formatDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export function HomeBlogSectionView({ posts, state = "ready" }: HomeBlogSectionProps) {
  return (
    <section className={`section ${styles.section}`} id="blog" aria-labelledby="home-blog-title">
      <div className={`shell ${styles.heading}`}>
        <div>
          <p className="section-kicker">Blog da Arena</p>
          <h2 id="home-blog-title">Artigos mais recentes.</h2>
        </div>
        <div className={styles.intro}>
          <p>Esporte, saúde e histórias para levar a energia da Arena além das quadras.</p>
          <Link className={`button button-primary ${styles.allLink}`} href="/blog">
            Ver todos os artigos <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {state === "ready" && posts.length > 0 ? (
        <div className={`shell ${styles.grid}`}>
          {posts.slice(0, 3).map((post) => (
            <article className={styles.card} key={post.id}>
              <Link className={styles.image} href={`/blog/${post.slug}`} aria-label={`Ler ${post.title}`}>
                {post.coverUrl ? (
                  <Image
                    src={post.coverUrl}
                    alt={post.coverAlt || `Capa do artigo ${post.title}`}
                    fill
                    sizes="(max-width: 650px) calc(100vw - 40px), (max-width: 920px) calc((100vw - 64px) / 2), (max-width: 1220px) calc((100vw - 88px) / 3), 378px"
                  />
                ) : (
                  <span className={styles.placeholder} aria-hidden="true"><span>Arena<br />Sul.</span></span>
                )}
              </Link>
              <div className={styles.body}>
                {post.publishedAt ? (
                  <time className={styles.date} dateTime={post.publishedAt}>{formatDate.format(new Date(post.publishedAt))}</time>
                ) : null}
                <h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3>
                <p>{post.excerpt}</p>
                <Link className={styles.readLink} href={`/blog/${post.slug}`}>
                  Ler artigo <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : state === "loading" ? (
        <div className={`shell ${styles.loading}`} role="status">
          <span className={styles.loadingMark} aria-hidden="true" />
          <p>Carregando os artigos mais recentes…</p>
        </div>
      ) : (
        <div className={`shell ${styles.empty}`}>
          <svg className={styles.emptyIcon} viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M32 17c-7-5-15-6-24-4v35c9-2 17-1 24 4m0-35c7-5 15-6 24-4v35c-9-2-17-1-24 4m0-35v35M16 23c3-.3 6 0 9 1m-9 8c3-.3 6 0 9 1m14-9c3-1 6-1.3 9-1m-9 10c3-1 6-1.3 9-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h3>{state === "unavailable" ? "Vamos continuar essa leitura?" : "Novas histórias vêm por aí."}</h3>
            <p>{state === "unavailable"
              ? "Não foi possível carregar os artigos agora. Acesse o blog para tentar novamente."
              : "Em breve, confira aqui os primeiros artigos da Arena Sul sobre esporte, saúde e convivência."}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function HomeBlogSectionFallback() {
  return <HomeBlogSectionView posts={[]} state="loading" />;
}

export async function HomeBlogSection() {
  // Keep the dynamic boundary outside the recoverable data-fetch error handler.
  await connection();
  let posts: BlogPostSummary[] = [];
  let state: HomeBlogSectionProps["state"] = "ready";
  try {
    const { getPublishedBlogPosts } = await import("@/lib/blog/queries");
    posts = await getPublishedBlogPosts({ limit: 3 });
  } catch {
    console.error(JSON.stringify({ event: "home_blog_load_failed" }));
    state = "unavailable";
  }
  return <HomeBlogSectionView posts={posts} state={state} />;
}
