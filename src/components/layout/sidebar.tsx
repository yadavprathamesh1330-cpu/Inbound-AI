"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui-custom/icon";
import { primaryNavItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function Sidebar({
  collapsed,
  onToggleCollapse,
  className,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 88 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-outline-variant bg-surface px-unit-md py-unit-lg lg:flex",
        className,
      )}
    >
      <div className="mb-unit-xl flex items-center gap-3 px-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary">
          <Icon name="smart_toy" className="size-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-headline-md text-headline-md font-bold leading-none text-on-surface">
              Omni AI
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Enterprise Voice
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
        {primaryNavItems.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all duration-200 hover:bg-surface-container hover:text-primary",
                active &&
                  "border-r-4 border-primary bg-surface-container-low font-bold text-primary",
              )}
            >
              <Icon name={item.icon} className="size-5 shrink-0" />
              {!collapsed && (
                <span className="truncate text-body-md text-body-md">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline-variant/30 pt-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container"
        >
          <Icon name="help" className="size-5 shrink-0" />
          {!collapsed && <span className="text-body-md text-body-md">Help</span>}
        </Link>
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container"
        >
          <Icon
            name="menu_open"
            className={cn("size-5 shrink-0 transition-transform", collapsed && "rotate-180")}
          />
          {!collapsed && (
            <span className="text-body-md text-body-md">Collapse</span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
