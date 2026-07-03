"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui-custom/icon";
import { cn } from "@/lib/utils";

export interface OrgRow {
  id: string;
  name: string;
  createdAt: string;
  users: number;
  agents: number;
  leads: number;
  calls: number;
  minutes: number;
  cost: number;
  creditCents: number;
  status: string;
  plan: string;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial",
  owner_operator: "Owner-Operator",
  fleet: "Fleet",
  enterprise: "Enterprise",
};

function usd(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function OrgTable({ rows }: { rows: OrgRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, query]);

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-unit-md border-b border-outline-variant px-unit-lg py-unit-md sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-headline-md text-headline-md text-on-surface">
            Organizations
          </h2>
          <p className="text-label-sm text-on-surface-variant">
            {rows.length} total · click a row for full detail &amp; credit
            management
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search organizations…"
            className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-9 pr-3 text-body-md text-on-surface outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-outline-variant text-label-sm uppercase tracking-wider text-on-surface-variant">
              <th className="px-unit-lg py-unit-sm font-semibold">Organization</th>
              <th className="px-unit-md py-unit-sm font-semibold">Plan</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Credits</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Users</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Agents</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Calls</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Minutes</th>
              <th className="px-unit-md py-unit-sm text-right font-semibold">Est. Cost</th>
              <th className="px-unit-lg py-unit-sm text-right font-semibold" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-unit-lg py-unit-xl text-center text-body-md text-on-surface-variant"
                >
                  No organizations match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            )}
            {filtered.map((o) => (
              <tr
                key={o.id}
                className="group border-b border-outline-variant/50 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
              >
                <td className="px-unit-lg py-unit-md">
                  <Link href={`/admin/orgs/${o.id}`} className="flex items-center gap-2 font-medium hover:text-primary">
                    {o.name}
                    {o.status === "SUSPENDED" && (
                      <span className="rounded-full bg-error/10 px-2 py-0.5 text-label-sm font-semibold text-error">
                        Suspended
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-unit-md py-unit-md text-on-surface-variant">
                  {PLAN_LABELS[o.plan] ?? o.plan}
                </td>
                <td
                  className={cn(
                    "px-unit-md py-unit-md text-right font-semibold",
                    o.creditCents <= 0 ? "text-error" : "text-emerald-600",
                  )}
                >
                  {usd(o.creditCents / 100)}
                </td>
                <td className="px-unit-md py-unit-md text-right">{o.users}</td>
                <td className="px-unit-md py-unit-md text-right">{o.agents}</td>
                <td className="px-unit-md py-unit-md text-right">{o.calls}</td>
                <td className="px-unit-md py-unit-md text-right">{o.minutes}</td>
                <td className="px-unit-md py-unit-md text-right">{usd(o.cost)}</td>
                <td className="px-unit-lg py-unit-md text-right">
                  <Link
                    href={`/admin/orgs/${o.id}`}
                    className="inline-flex items-center gap-1 text-label-md font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    Manage
                    <Icon name="chevron_right" className="size-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
