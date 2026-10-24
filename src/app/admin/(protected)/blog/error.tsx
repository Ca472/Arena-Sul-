"use client";

import Link from "next/link";

import styles from "@/app/admin/admin.module.css";

export default function AdminBlogError({ reset }: { reset: () => void }) {
  return (
    <section className={styles.formSection}>
      <h1 className={styles.title}>Não foi possível abrir o blog.</h1>
      <p className={styles.subtitle}>Tente carregar a página novamente. Se o problema continuar, confira sua conexão e entre no painel outra vez.</p>
      <button className={styles.primaryButton} type="button" onClick={reset}>Tentar novamente</button>
      <Link className={styles.secondaryButton} href="/admin/blog">Voltar aos artigos</Link>
    </section>
  );
}
