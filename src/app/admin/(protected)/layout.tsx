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
            <Link className={styles.navLink} href="/admin">
              <span className={styles.desktopNavLabel}>Visão geral</span>
              <span className={styles.mobileNavLabel}>Início</span>
            </Link>
            <Link className={styles.navLink} href="/admin/eventos/novo">
              <span className={styles.desktopNavLabel}>Novo evento</span>
              <span className={styles.mobileNavLabel}>Novo</span>
            </Link>
            <Link className={styles.navLink} href="/admin/fotos">
              <span className={styles.desktopNavLabel}>Fotos do site</span>
              <span className={styles.mobileNavLabel}>Fotos</span>
            </Link>
            <Link className={styles.navLink} href="/admin/integracoes/instagram">
              <span className={styles.desktopNavLabel}>Instagram</span>
              <span className={styles.mobileNavLabel}>Insta</span>
            </Link>
            <Link className={styles.navLink} href="/">
              <span className={styles.desktopNavLabel}>Ver o portal</span>
              <span className={styles.mobileNavLabel}>Site</span>
            </Link>
          </nav>

          <div className={styles.account}>
            <div className={styles.accountIdentity}>
              <strong>{admin.displayName}</strong>
              <span>{admin.email}</span>
            </div>
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                <span className={styles.desktopLogoutLabel}>
                  {admin.isDemo ? "Sair da demonstração" : "Encerrar sessão"}
                </span>
                <span className={styles.mobileLogoutLabel}>Sair</span>
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
