import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { logoutAction } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import { AdminIcon } from "@/components/admin/admin-icon";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { AdminTopbar } from "@/components/admin/admin-topbar";
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
  const displayName = admin.displayName.trim();
  const accountName = displayName && displayName.toLowerCase() !== admin.email.toLowerCase()
    ? displayName
    : "Administrador";
  const accountInitials = accountName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

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
              <span>Painel de conteúdo</span>
            </span>
          </Link>

          <AdminNavigation />

          <div className={styles.account}>
            <div className={styles.accountProfile}>
              <span className={styles.accountAvatar} aria-hidden="true">{accountInitials}</span>
              <div className={styles.accountIdentity}>
                <strong>{accountName}</strong>
                <span title={admin.email}>{admin.email}</span>
              </div>
            </div>
            <form action={logoutAction}>
              <button className={styles.logoutButton} type="submit">
                <AdminIcon name="logout" size={16} />
                <span className={styles.desktopLogoutLabel}>
                  {admin.isDemo ? "Sair da demonstração" : "Encerrar sessão"}
                </span>
                <span className={styles.mobileLogoutLabel}>Sair</span>
              </button>
            </form>
          </div>
        </aside>

        <div className={styles.mainColumn}>
          <AdminTopbar />
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
