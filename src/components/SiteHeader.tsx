"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MenuIcon } from "./InfoIcons";

const NAV_LINKS: { href: string; label: string; external?: boolean }[] = [
  { href: "https://sundgau-poker-club.fr/", label: "Accueil", external: true },
  { href: "/tournois", label: "Tournois" },
  {
    href: "https://sundgau-poker-club.fr/",
    label: "Le club",
    external: true,
  },
  {
    href: "https://sundgau-poker-club.fr/classement/",
    label: "Classement",
    external: true,
  },
  {
    href: "https://sundgau-poker-club.fr/forum/",
    label: "Forum (en cours)",
    external: true,
  },
  {
    href: "https://sundgau-poker-club.fr/demande-dinscription/",
    label: "Devenir membre du club",
    external: true,
  },
  {
    href: "https://sundgau-poker-club.fr/actualites/",
    label: "Autres actualités",
    external: true,
  },
];

export function SiteHeader({ active }: { active: "/tournois" | "/admin" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function navItemClass(link: (typeof NAV_LINKS)[number], variant: "inline" | "dropdown") {
    const isActive = link.href === active && link.label === "Tournois";
    if (variant === "inline") {
      return `border-b-2 pb-1 text-sm font-semibold text-text transition-opacity hover:opacity-80 ${
        isActive ? "border-accent" : "border-transparent"
      }`;
    }
    return `block px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-soft)] ${
      isActive ? "text-accent" : "text-text"
    }`;
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-4 sm:px-8">
        <Link href="/tournois" className="flex shrink-0 items-center">
          <Image
            src="/images/logo.png"
            alt="Sundgau Poker Club"
            width={80}
            height={80}
            className="h-[calc(var(--spacing)*20)] w-[calc(var(--spacing)*20)] shrink-0"
          />
        </Link>

        {/* PC (lg et plus) : chaque lien affiché en ligne, comme avant. */}
        <nav className="hidden flex-wrap items-center gap-x-6 gap-y-2 lg:flex">
          {NAV_LINKS.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                className={navItemClass(link, "inline")}
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className={navItemClass(link, "inline")}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Mobile et tablette (moins de lg) : menu déroulant compact. */}
        <div className="relative lg:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-text transition-colors hover:border-accent"
          >
            <MenuIcon className="h-4 w-4" />
            Menu
          </button>

          {open && (
            <nav className="absolute top-full left-0 z-50 mt-2 w-64 overflow-hidden rounded-md border border-[var(--border)] bg-surface py-1.5 shadow-xl">
              {NAV_LINKS.map((link) =>
                link.external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className={navItemClass(link, "dropdown")}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={navItemClass(link, "dropdown")}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
