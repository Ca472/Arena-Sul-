import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { getAdminBlogPosts } from "@/lib/blog/queries";

import blogStyles from "./blog-admin.module.css";

const formatDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" });

export default async function AdminBlogPage() {
  const posts = await getAdminBlogPosts();
  const published = posts.filter((post) => post.status === "published").length;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Conteúdo do site</p>
          <h1 className={styles.title}>Blog da Arena Sul</h1>
          <p className={styles.subtitle}>Escreva seus artigos, confira a prévia e publique quando estiverem prontos. Rascunhos ficam visíveis apenas no painel.</p>
        </div>
        <Link className={styles.primaryButton} href="/admin/blog/novo">Criar artigo</Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}><span>Artigos</span><strong>{posts.length}</strong></div>
        <div className={styles.statCard}><span>Publicados</span><strong>{published}</strong></div>
        <div className={styles.statCard}><span>Rascunhos</span><strong>{posts.length - published}</strong></div>
      </div>

      <section className={styles.panel} aria-labelledby="admin-blog-title">
        <div className={styles.panelHeader}><h2 id="admin-blog-title">Seus artigos</h2><Link className={styles.secondaryButton} href="/blog" target="_blank" rel="noopener noreferrer">Ver blog no site ↗</Link></div>
        {posts.length ? (
          <div className={blogStyles.list}>
            {posts.map((post) => (
              <article key={post.id} className={blogStyles.row}>
                <div>
                  <strong className={blogStyles.rowTitle}>{post.title || "Artigo sem título"}</strong>
                  <div className={blogStyles.rowMeta}><time dateTime={post.updatedAt}>Editado em {formatDate.format(new Date(post.updatedAt))}</time>{post.publishedAt && post.status === "published" ? <time dateTime={post.publishedAt}>Publicado em {formatDate.format(new Date(post.publishedAt))}</time> : null}</div>
                  {post.status === "published" ? <div className={blogStyles.rowActions}><Link className={blogStyles.helper} href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">Abrir artigo no site ↗</Link></div> : null}
                </div>
                <span className={`${styles.badge} ${post.status === "published" ? styles.published : styles.draft}`}>{post.status === "published" ? "Publicado" : "Rascunho"}</span>
                <Link className={styles.secondaryButton} href={`/admin/blog/${post.id}/editar`} aria-label={`Editar ${post.title || "artigo sem título"}`}>Editar artigo</Link>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}><p>Você ainda não criou nenhum artigo.</p><p>Comece um rascunho e use a prévia para revisar antes de publicar.</p></div>
        )}
      </section>
    </>
  );
}
