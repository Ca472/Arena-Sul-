import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { getAdminBlogPost } from "@/lib/blog/queries";
import { isDemoMode } from "@/lib/config/runtime";

import { BlogForm } from "../../_components/blog-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const post = await getAdminBlogPost(id);
  if (!post) notFound();

  return (
    <>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Conteúdo do site</p><h1 className={styles.title}>Editar artigo</h1><p className={styles.subtitle}>Revise o conteúdo e salve. As mudanças em artigos publicados aparecem no site após a gravação.</p></div>
        <Link className={styles.secondaryButton} href="/admin/blog">Voltar aos artigos</Link>
      </header>
      <BlogForm key={post.id} postId={post.id} initialPost={post} demoMode={isDemoMode()} />
    </>
  );
}
