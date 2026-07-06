"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui-custom/icon";
import { VoicePulse } from "@/components/ui-custom/voice-pulse";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/types";

export function Topbar({
  collapsed,
  user,
  unreadNotificationCount = 0,
}: {
  collapsed: boolean;
  user: CurrentUser;
  unreadNotificationCount?: number;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className={cn(
        "glass-nav fixed right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/30 px-4 transition-[left] duration-300 md:px-margin-desktop",
        collapsed ? "left-0 lg:left-[88px]" : "left-0 lg:left-64",
      )}
    >
      <div className="flex flex-1 items-center gap-unit-md">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <button className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container lg:hidden" />
            }
          >
            <Icon name="menu_open" className="size-5 rotate-180" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar
              collapsed={false}
              onToggleCollapse={() => setMobileOpen(false)}
              className="!static !flex !h-full !w-full"
            />
          </SheetContent>
        </Sheet>

        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />
          <input
            className="w-full rounded-xl border-none bg-surface-container-low py-2 pl-10 pr-4 text-label-sm font-label-sm transition-all focus:ring-2 focus:ring-secondary"
            placeholder="Search interactions, leads, or agents..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/settings?tab=notifications"
            className="relative text-on-surface-variant transition-colors hover:text-primary"
            title={
              unreadNotificationCount > 0
                ? `${unreadNotificationCount} unread notification${unreadNotificationCount === 1 ? "" : "s"}`
                : "Notifications"
            }
          >
            <Icon name="notifications" className="size-5" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            )}
          </Link>
          <div className="hidden items-center gap-2 sm:flex" title="Live system status">
            <VoicePulse size={10} />
            <span className="text-xs font-medium text-on-surface-variant">
              Live
            </span>
          </div>
        </div>
        <div className="hidden h-8 w-px bg-outline-variant/30 sm:block" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3"
              />
            }
          >
            <div className="hidden text-right sm:block">
              <p className="text-label-sm font-bold text-on-surface">
                {user.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-outline">
                {user.role}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-primary/10 bg-primary text-sm font-bold text-primary-foreground">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem render={<Link href="/settings" />}>
              Account settings
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/billing" />}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" render={<Link href="/logout" />}>
              <Icon name="logout" className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
