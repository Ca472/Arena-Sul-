import type { Metadata } from "next";

import { SiteMediaManager } from "@/app/admin/(protected)/fotos/site-media-manager";
import styles from "@/app/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSiteMediaItems } from "@/lib/site-media/queries";

export const metadata: Metadata = {
  title: "Fotos do site | Administração",
};

export default async function AdminSitePhotosPage() {
  const admin = await requireAdmin();
  const items = await getAdminSiteMediaItems();
  const customCount = items.filter(({ isDefault }) => !isDefault).length;

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Conteúdo visual</p>
          <h1 className={styles.title}>Fotos do site</h1>
          <p className={styles.subtitle}>
            Troque as fotos do portal sem alterar o código. Cada posição mantém
            uma imagem original de segurança e pode ser restaurada a qualquer
            momento.
          </p>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Resumo das fotos do site">
        <article className={styles.statCard}>
          <span>Posições editáveis</span>
          <strong>{items.length}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Fotos personalizadas</span>
          <strong>{customCount}</strong>
        </article>
        <article className={styles.statCard}>
          <span>Fotos originais</span>
          <strong>{items.length - customCount}</strong>
        </article>
      </section>

      <div className={styles.notice} role="note">
        Salve uma foto por vez. A alteração aparece no portal imediatamente e
        recebe um endereço novo para evitar que o navegador mostre a versão
        anterior em cache.
      </div>

      <SiteMediaManager items={items} demoMode={admin.isDemo} />
    </>
  );
}
