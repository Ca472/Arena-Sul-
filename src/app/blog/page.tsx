import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getPublishedBlogPosts } from "@/lib/blog/queries";

import { BlogFooter, BlogHeader } from "./_components/blog-chrome";
import styles from "./blog.module.css";

const baseMetadata: Metadata = {
  title: "Blog",
  description: "Artigos da Arena Sul Sports sobre esportes de areia, saúde e convivência em São José dos Campos.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog da Arena Sul Sports",
    description: "Esporte, saúde e histórias da Arena Sul Sports.",
    url: "/blog",
    images: [{ url: "/images/arena-sul-og-background.jpg", width: 1728, height: 912, alt: "Arena Sul Sports" }],
  },
};

type Props = { searchParams: Promise<{ page?: string | string[] }> };

function pageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d{0,4}$/.test(value) || Number(value) > 83334) return null;
  return Number(value);
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).page) ?? 1;
  return {
    ...baseMetadata,
    title: page > 1 ? `Blog — página ${page}` : "Blog",
    alternates: { canonical: page > 1 ? `/blog?page=${page}` : "/blog" },
    openGraph: { ...baseMetadata.openGraph, url: page > 1 ? `/blog?page=${page}` : "/blog" },
  };
}

const formatDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

export default async function BlogPage({ searchParams }: Props) {
  const page = pageNumber((await searchParams).page);
  if (page === null) redirect("/blog");
  const results = await getPublishedBlogPosts({ limit: 13, offset: (page - 1) * 12 });
  if (page > 1 && results.length === 0) notFound();
  const posts = results.slice(0, 12);
  const hasMore = results.length > 12;

  return (
    <main className={`public-site ${styles.page}`}>
      <BlogHeader />
      <section className={styles.hero}>
        <div className={`shell ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Blog da Arena</p>
          <h1>Esporte que faz parte da vida.</h1>
          <p>Conteúdos da Arena Sul sobre esporte, saúde e os encontros que acontecem dentro e fora das quadras.</p>
        </div>
      </section>

      <section className={styles.listing} aria-labelledby="blog-list-title">
        <div className={`shell ${styles.listingIntro}`}>
          <h2 id="blog-list-title">Leituras da Arena Sul</h2>
          <p>Confira os artigos publicados pela nossa equipe.</p>
        </div>
        {posts.length ? (
          <div className={`shell ${styles.grid}`}>
            {posts.map((post) => (
              <article className={styles.card} key={post.id}>
                <Link className={styles.cardImage} href={`/blog/${post.slug}`} aria-label={`Ler ${post.title}`}>
                  {post.coverUrl ? (
                    <Image src={post.coverUrl} alt={post.coverAlt || `Capa do artigo ${post.title}`} fill sizes="(max-width: 650px) 100vw, (max-width: 920px) 50vw, 33vw" />
                  ) : <span className={styles.cardPlaceholder} aria-hidden="true">Arena<br />Sul.</span>}
                </Link>
                <div className={styles.cardBody}>
                  {post.publishedAt ? <time className={styles.cardDate} dateTime={post.publishedAt}>{formatDate.format(new Date(post.publishedAt))}</time> : null}
                  <h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2>
                  <p>{post.excerpt}</p>
                  <Link className={styles.cardLink} href={`/blog/${post.slug}`}>Ler artigo <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={`shell ${styles.empty}`}>
            <span className={styles.emptyMark} aria-hidden="true">Em breve, novas leituras.</span>
            <p>Os primeiros artigos aparecerão aqui assim que forem publicados pela equipe da Arena Sul.</p>
            <Link className={styles.cardLink} href="/">Conheça a Arena <span aria-hidden="true">→</span></Link>
          </div>
        )}
        {page > 1 || hasMore ? (
          <nav className={`shell ${styles.pagination}`} aria-label="Páginas de artigos">
            {page > 1 ? <Link href={page === 2 ? "/blog" : `/blog?page=${page - 1}`} rel="prev">← Mais recentes</Link> : <span />}
            <span aria-current="page">Página {page}</span>
            {hasMore ? <Link href={`/blog?page=${page + 1}`} rel="next">Mais antigos →</Link> : <span />}
          </nav>
        ) : null}
      </section>
      <BlogFooter />
    </main>
  );
}
