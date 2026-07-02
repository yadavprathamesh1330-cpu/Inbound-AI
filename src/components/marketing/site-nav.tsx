"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { label: "Platform", href: "#platform" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-outline-variant/30">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-margin-desktop">
        <Link
          href="/"
          className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface"
        >
          Omni AI
        </Link>

        {/* Desktop links */}
        <div className="hidden gap-unit-xl md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body-md text-on-surface-variant transition-colors duration-150 hover:text-secondary"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden items-center gap-unit-md md:flex">
          <Link
            href="/login"
            className="text-body-md text-on-surface-variant transition-colors hover:text-secondary"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-6 py-2.5 text-label-md font-semibold text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex size-11 items-center justify-center rounded-xl text-on-surface transition-colors hover:bg-surface-container-high md:hidden"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden border-t border-outline-variant/30 bg-surface shadow-lg md:hidden"
          >
            <div className="flex flex-col gap-unit-xs px-margin-mobile py-unit-md">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3 text-body-lg font-medium text-on-surface",
                    "transition-colors hover:bg-surface-container-high hover:text-secondary",
                  )}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-unit-sm flex flex-col gap-unit-sm border-t border-outline-variant/30 pt-unit-md">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-center text-body-lg font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-primary px-4 py-3.5 text-center text-body-lg font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
                >
                  Start Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
