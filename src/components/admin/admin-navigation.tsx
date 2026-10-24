"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import styles from "@/app/admin/admin.module.css";
import { AdminIcon } from "./admin-icon";

const links = [
  { href: "/admin", label: "Visão geral", mobileLabel: "Início", icon: "dashboard" },
  { href: "/admin/eventos/novo", label: "Novo evento", mobileLabel: "Novo evento", icon: "plus" },
  { href: "/admin/fotos", label: "Fotos do site", mobileLabel: "Fotos", icon: "image" },
  { href: "/admin/blog", label: "Blog", mobileLabel: "Blog", icon: "pen" },
  { href: "/admin/integracoes/instagram", label: "Instagram", mobileLabel: "Instagram", icon: "instagram" },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const revealActiveLink = () => {
      if (nav.scrollWidth <= nav.clientWidth + 1) return;
      const active = nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
      if (!active) return;
      const bounds = nav.getBoundingClientRect();
      const linkBounds = active.getBoundingClientRect();
      const inset = 8;
      const delta = linkBounds.right > bounds.right - inset
        ? linkBounds.right - bounds.right + inset
        : linkBounds.left < bounds.left + inset
          ? linkBounds.left - bounds.left - inset
          : 0;
      if (delta) nav.scrollBy({ left: delta, behavior: "auto" });
    };

    revealActiveLink();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(revealActiveLink);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Navegação administrativa">
      <p className={styles.navGroupLabel}>Gerenciar conteúdo</p>
      {links.map((link) => {
        const active = link.href === "/admin"
          ? pathname === "/admin" || (pathname.startsWith("/admin/eventos/") && !pathname.startsWith("/admin/eventos/novo"))
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`} href={link.href} aria-current={active ? "page" : undefined}>
            <AdminIcon name={link.icon} size={19} />
            <span className={styles.desktopNavLabel}>{link.label}</span>
            <span className={styles.mobileNavLabel}>{link.mobileLabel}</span>
          </Link>
        );
      })}
      <Link className={`${styles.navLink} ${styles.navPortal}`} href="/">
        <AdminIcon name="external" size={18} />
        <span className={styles.desktopNavLabel}>Ver o portal</span>
        <span className={styles.mobileNavLabel}>Site</span>
      </Link>
    </nav>
  );
}
