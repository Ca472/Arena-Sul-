"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/#arena", label: "A Arena" },
  { href: "/#estrutura", label: "Estrutura" },
  { href: "/#modalidades", label: "Esportes" },
  { href: "/#eventos", label: "Eventos" },
];

const contactUrl =
  "https://wa.me/551233071093?text=Ol%C3%A1%2C%20quero%20conhecer%20as%20op%C3%A7%C3%B5es%20da%20Arena%20Sul.";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", open);

    if (!open) {
      return () => document.body.classList.remove("menu-open");
    }

    const inertStates = new Map<HTMLElement, boolean>();
    const makeInert = (element: HTMLElement) => {
      if (!inertStates.has(element)) {
        inertStates.set(element, element.inert);
      }
      element.inert = true;
    };

    const header = toggleRef.current?.closest<HTMLElement>(".site-header");
    const page = header?.closest<HTMLElement>(".public-site");

    header
      ?.querySelectorAll<HTMLElement>(".brand, .header-cta")
      .forEach(makeInert);

    let activeLayer = header;
    while (activeLayer && page && activeLayer !== page) {
      const parent = activeLayer.parentElement;
      if (!parent) {
        break;
      }

      Array.from(parent.children).forEach((sibling) => {
        if (sibling !== activeLayer && sibling instanceof HTMLElement) {
          makeInert(sibling);
        }
      });
      activeLayer = parent;
    }

    firstLinkRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const navLinks = Array.from(
        navRef.current?.querySelectorAll<HTMLAnchorElement>("a[href]") ?? [],
      );
      const focusable = toggleRef.current
        ? [toggleRef.current, ...navLinks]
        : navLinks;

      if (focusable.length === 0) {
        return;
      }

      const currentIndex = focusable.indexOf(
        document.activeElement as HTMLButtonElement | HTMLAnchorElement,
      );

      if (event.shiftKey && currentIndex <= 0) {
        event.preventDefault();
        focusable.at(-1)?.focus();
      } else if (!event.shiftKey && currentIndex === focusable.length - 1) {
        event.preventDefault();
        focusable[0]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("menu-open");
      inertStates.forEach((wasInert, element) => {
        element.inert = wasInert;
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 851px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setOpen(false);
      }
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header
      className="site-header shell"
      aria-label={open ? "Menu principal" : undefined}
      aria-modal={open ? true : undefined}
      role={open ? "dialog" : undefined}
    >
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
        ref={toggleRef}
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
        ref={navRef}
        id="site-navigation"
        className={open ? "is-open" : undefined}
        aria-label="Navegação principal"
      >
        {links.map((link, index) => (
          <a
            ref={index === 0 ? firstLinkRef : undefined}
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <a
          className="mobile-nav-cta"
          href={contactUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => setOpen(false)}
        >
          Falar no WhatsApp
        </a>
      </nav>

      <a
        className="header-cta"
        href={contactUrl}
        target="_blank"
        rel="noreferrer"
      >
        Falar no WhatsApp
      </a>
    </header>
  );
}
