"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "/#arena", label: "A Arena" },
  { href: "/#estrutura", label: "Estrutura" },
  { href: "/#modalidades", label: "Modalidades" },
  { href: "/#eventos", label: "Eventos" },
  { href: "/#contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);

    if (!open) {
      return () => document.body.classList.remove("menu-open");
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <header className="site-header shell">
      <Link className="brand" href="/" aria-label="Arena Sul Sports — início">
        <Image
          src="/images/arena-sul-logo.png"
          alt="Arena Sul Sports"
          width={225}
          height={225}
          priority
        />
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-expanded={open}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-controls="site-navigation"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
      </button>

      <nav
        id="site-navigation"
        className={open ? "is-open" : undefined}
        aria-label="Navegação principal"
      >
        {links.map((link) => (
          <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
            {link.label}
          </a>
        ))}
      </nav>

      <a
        className="header-cta"
        href="https://wa.me/551233071093?text=Ol%C3%A1%2C%20quero%20planejar%20um%20evento%20na%20Arena%20Sul."
        target="_blank"
        rel="noreferrer"
      >
        Planeje seu evento
      </a>
    </header>
  );
}
