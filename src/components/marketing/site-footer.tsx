const links = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Security", href: "#" },
  { label: "Status", href: "#" },
  { label: "Contact", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-outline-variant bg-gradient-to-b from-transparent to-primary/5">
      <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-unit-md px-margin-desktop py-unit-xl md:flex-row">
        <div className="text-headline-md text-headline-md font-bold text-on-surface">
          Omni AI
        </div>
        <div className="flex flex-wrap justify-center gap-unit-lg">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-body-md text-on-surface-variant transition-colors hover:text-secondary"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="text-body-md text-on-surface-variant opacity-60">
          &copy; {new Date().getFullYear()} Omni AI. Engineered for Performance.
        </div>
      </div>
    </footer>
  );
}
