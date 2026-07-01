import Link from "next/link";

const links = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNav() {
  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-outline-variant/30">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link
          href="/"
          className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface"
        >
          Omni AI
        </Link>
        <div className="hidden gap-unit-xl md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body-md text-body-md text-on-surface-variant transition-all duration-150 hover:text-secondary"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-unit-md">
          <Link
            href="/login"
            className="text-body-md text-body-md text-on-surface-variant transition-colors hover:text-secondary"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-6 py-2.5 text-label-md text-label-md font-semibold text-primary-foreground transition-transform hover:scale-105"
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
