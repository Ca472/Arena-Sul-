"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { AdminIcon } from "./admin-icon";

function pageLocation(pathname: string): Array<{ label: string; href?: string }> {
  if (pathname.startsWith("/admin/blog/novo")) return [{ label: "Blog", href: "/admin/blog" }, { label: "Novo artigo" }];
  if (pathname.startsWith("/admin/blog/")) return [{ label: "Blog", href: "/admin/blog" }, { label: "Editar artigo" }];
  if (pathname === "/admin/blog") return [{ label: "Blog" }];
  if (pathname.startsWith("/admin/eventos/novo")) return [{ label: "Eventos", href: "/admin" }, { label: "Novo evento" }];
  if (pathname.startsWith("/admin/eventos/")) return [{ label: "Eventos", href: "/admin" }, { label: "Editar evento" }];
  if (pathname.startsWith("/admin/fotos")) return [{ label: "Fotos do site" }];
  if (pathname.startsWith("/admin/integracoes/instagram")) return [{ label: "Instagram" }];
  return [{ label: "Visão geral" }];
}

export function AdminTopbar() {
  const location = pageLocation(usePathname());

  return (
    <header className={styles.workspaceHeader}>
      <div>
        <p className={styles.workspaceEyebrow}>Arena Sul Sports</p>
        <nav aria-label="Localização no painel">
          <ol className={styles.breadcrumbs}>
            <li><Link href="/admin">Administração</Link></li>
            {location.map((item) => (
              <li key={item.label}>
                <AdminIcon name="chevron-right" size={14} />
                {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <Link className={styles.portalButton} href="/" target="_blank" rel="noopener noreferrer">
        Ver site <AdminIcon name="external" size={15} />
      </Link>
    </header>
  );
}
