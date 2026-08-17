import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import { requireAdmin } from "@/lib/auth/admin";

type AdminLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: "Administração",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const admin = await requireAdmin();

  return (
    <div className={styles.adminShell}>
      <div className={styles.shellGrid}>
        <aside className={styles.sidebar}>
          <Link className={styles.brand} href="/admin">
            <Image
              className={styles.brandLogo}
              src="/images/arena-sul-logo-white.png"
              alt="Arena Sul Sports"
              width={92}
              height={70}
              preload
            />
            <span className={styles.brandText}>
              <strong>Arena Sul</strong>
              Administração
            </span>
          </Link>

          <nav className={styles.nav} aria-label="Navegação administrativa">
            <Link className={styles.navLink} href="/admin">Visão geral</Link>
            <Link className={styles.navLink} href="/admin/eventos/novo">Novo evento</Link>
            <Link className={styles.navLink} href="/">Ver o portal</Link>
          </nav>

          <div className={styles.account}>
            <strong>{admin.displayName}</strong>
            <span>{admin.email}</span>
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                {admin.isDemo ? "Sair da demonstração" : "Encerrar sessão"}
              </button>
            </form>
          </div>
        </aside>

        <div className={styles.mainColumn}>
          {admin.isDemo ? (
            <div className={styles.demoBanner} role="status">
              ● Modo demonstração ativo — nenhuma alteração ou foto será salva.
            </div>
          ) : null}
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </div>
  );
}
