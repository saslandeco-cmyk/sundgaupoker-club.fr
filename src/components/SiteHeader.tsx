import Image from "next/image";
import Link from "next/link";

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

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === active && link.label === "Tournois";
            const className = `border-b-2 pb-1 text-sm font-semibold text-text transition-opacity hover:opacity-80 ${
              isActive ? "border-accent" : "border-transparent"
            }`;
            if (link.external) {
              return (
                <a key={link.label} href={link.href} className={className}>
                  {link.label}
                </a>
              );
            }
            return (
              <Link key={link.label} href={link.href} className={className}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/admin"
          className={`ml-auto text-sm underline-offset-4 hover:text-text hover:underline ${
            active === "/admin" ? "text-accent" : "text-text-soft"
          }`}
        >
          Espace organisateur
        </Link>
      </div>
    </header>
  );
}
