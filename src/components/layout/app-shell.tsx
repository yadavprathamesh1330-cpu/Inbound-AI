"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { cn } from "@/lib/utils";
import type { CurrentUser } from "@/lib/types";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        isSuperAdmin={user.isSuperAdmin}
      />
      <Topbar collapsed={collapsed} user={user} />
      <main
        className={cn(
          "min-h-screen pb-unit-2xl pt-24 transition-[margin] duration-300",
          "px-4 md:px-margin-desktop",
          collapsed ? "lg:ml-[88px]" : "lg:ml-64",
        )}
      >
        {children}
      </main>
    </div>
  );
}
