import Link from "next/link";

import styles from "@/app/admin/admin.module.css";

export default function EventNotFound() {
  return (
    <section className={styles.panel}>
      <div className={styles.emptyState}>
        <h1>Evento não encontrado</h1>
        <p>O conteúdo pode ter sido removido ou o endereço está incorreto.</p>
        <Link className={styles.primaryButton} href="/admin">Voltar aos eventos</Link>
      </div>
    </section>
  );
}
