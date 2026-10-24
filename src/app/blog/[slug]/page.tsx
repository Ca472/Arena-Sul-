import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BlogContent } from "@/components/blog-content";
import { getPublishedBlogPost } from "@/lib/blog/queries";

import { BlogFooter, BlogHeader } from "../_components/blog-chrome";
import styles from "../blog.module.css";

type Props = { params: Promise<{ slug: string }> };
const getPost = cache(getPublishedBlogPost);
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.arenasulsports.com";
const formatDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Artigo não encontrado", robots: { index: false, follow: false } };
  const image = post.coverUrl ?? "/images/arena-sul-og-background.jpg";
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article", title: post.title, description: post.excerpt, url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt ?? undefined, modifiedTime: post.updatedAt,
      authors: ["Arena Sul Sports"],
      images: [{ url: image, alt: post.coverAlt || post.title }],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt, images: [image] },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const url = new URL(`/blog/${post.slug}`, siteUrl).toString();
  const structuredData = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: post.title, description: post.excerpt, url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    datePublished: post.publishedAt ?? undefined, dateModified: post.updatedAt,
    inLanguage: "pt-BR",
    image: post.coverUrl ?? new URL("/images/arena-sul-og-background.jpg", siteUrl).toString(),
    author: { "@type": "Organization", name: "Arena Sul Sports", url: siteUrl },
    publisher: { "@type": "Organization", name: "Arena Sul Sports", url: siteUrl, logo: { "@type": "ImageObject", url: new URL("/images/arena-sul-logo.png", siteUrl).toString() } },
  };

  return (
    <main className={`public-site ${styles.page}`}>
      <BlogHeader />
      <article>
        <header className={styles.articleHero}>
          <div className={`shell ${styles.articleHeroInner}`}>
            <Link className={styles.backLink} href="/blog"><span aria-hidden="true">←</span> Todos os artigos</Link>
            <p className={styles.eyebrow}>Blog da Arena</p>
            <h1>{post.title}</h1>
            <p className={styles.articleExcerpt}>{post.excerpt}</p>
            <div className={styles.articleMeta}>
              <span>Por Arena Sul Sports</span>
              {post.publishedAt ? <time dateTime={post.publishedAt}>{formatDate.format(new Date(post.publishedAt))}</time> : null}
            </div>
          </div>
        </header>
        <div className={`shell ${styles.articleLayout}`}>
          {post.coverUrl ? (
            <div className={styles.articleCover}>
              <Image src={post.coverUrl} alt={post.coverAlt || post.title} fill sizes="(max-width: 920px) 100vw, 960px" priority />
            </div>
          ) : null}
          <div className={styles.articleBody}><BlogContent content={post.content} /></div>
        </div>
        <footer className={styles.articleFooter}>
          <div className={`shell ${styles.articleFooterInner}`}>
            <div><p className={styles.eyebrow}>Dentro e fora das quadras</p><h2>Viva a Arena Sul.</h2><p>Conheça nossas modalidades e encontre seu próximo esporte.</p></div>
            <Link className={styles.articleCta} href="/#modalidades">Conheça as modalidades <span aria-hidden="true">↗</span></Link>
          </div>
        </footer>
      </article>
      <BlogFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    </main>
  );
}
