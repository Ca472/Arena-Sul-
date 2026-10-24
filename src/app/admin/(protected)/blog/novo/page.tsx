import { randomUUID } from "node:crypto";
import Link from "next/link";

import styles from "@/app/admin/admin.module.css";
import { isDemoMode } from "@/lib/config/runtime";

import { BlogForm } from "../_components/blog-form";

export default function NewBlogPostPage() {
  return (
    <>
      <header className={styles.pageHeader}>
        <div><p className={styles.eyebrow}>Novo conteúdo</p><h1 className={styles.title}>Criar artigo</h1><p className={styles.subtitle}>Escreva no seu ritmo. Você pode salvar um rascunho e voltar para terminar depois.</p></div>
        <Link className={styles.secondaryButton} href="/admin/blog">Voltar aos artigos</Link>
      </header>
      <BlogForm postId={randomUUID()} demoMode={isDemoMode()} />
    </>
  );
}
