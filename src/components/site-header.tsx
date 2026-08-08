import Link from "next/link";

import { Wordmark } from "./wordmark";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/day/1/", label: "Days" },
];

export function SiteHeader({ dates }: { dates: string }) {
  return (
    <header className="border-border bg-white border-b">
      <div className="px-md py-md gap-md mx-auto flex max-w-5xl items-center">
        <Link href="/" aria-label="The Way" className="mr-auto">
          <Wordmark />
        </Link>

        <p className="text-muted text-xs sm:text-sm">{dates}</p>

        <nav aria-label="Main" className="gap-lg hidden items-center sm:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-sm py-sm text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <details className="relative sm:hidden">
          <summary
            role="button"
            aria-label="Menu"
            className="size-11 grid cursor-pointer place-items-center list-none"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>

          <nav
            aria-label="Menu"
            className="border-border bg-white rounded-medium p-md gap-md right-0 top-full absolute z-10 flex w-48 flex-col border shadow-lg"
          >
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="py-sm">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
