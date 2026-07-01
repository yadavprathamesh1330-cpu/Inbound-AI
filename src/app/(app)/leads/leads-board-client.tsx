"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LeadStage } from "@/generated/prisma/enums";

type BoardLead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  stage: LeadStage;
  interestedService: string | null;
  score: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  agentId: string | null;
  callId: string | null;
  agent: { id: string; name: string } | null;
  call: {
    id: string;
    summary: string | null;
    sentiment: string | null;
    durationSeconds: number | null;
  } | null;
};

const STAGE_ORDER: LeadStage[] = [
  LeadStage.NEW,
  LeadStage.QUALIFIED,
  LeadStage.APPOINTMENT,
  LeadStage.WON,
  LeadStage.LOST,
];

const STAGE_LABELS: Record<LeadStage, string> = {
  NEW: "New",
  QUALIFIED: "Qualified",
  APPOINTMENT: "Appointment",
  WON: "Won",
  LOST: "Lost",
};

const STAGE_COLUMN_STYLES: Record<
  LeadStage,
  { dot: string; header: string }
> = {
  NEW: { dot: "bg-slate-400", header: "text-slate-600" },
  QUALIFIED: { dot: "bg-secondary", header: "text-secondary" },
  APPOINTMENT: { dot: "bg-amber-500", header: "text-amber-600" },
  WON: { dot: "bg-emerald-500", header: "text-emerald-600" },
  LOST: { dot: "bg-destructive", header: "text-destructive" },
};

function scoreBadgeClass(score: number | null) {
  if (score === null) return "bg-surface-container-high text-on-surface-variant";
  if (score >= 75) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-blue-100 text-blue-800";
  if (score >= 20) return "bg-slate-100 text-slate-700";
  return "bg-destructive/10 text-destructive";
}

function initials(name: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadLeadsCsv(leads: BoardLead[]) {
  const header = [
    "Name",
    "Phone",
    "Email",
    "Stage",
    "Interested Service",
    "Score",
    "Created At",
  ];
  const rows = leads.map((lead) => [
    lead.name ?? "",
    lead.phone ?? "",
    lead.email ?? "",
    STAGE_LABELS[lead.stage],
    lead.interestedService ?? "",
    lead.score !== null ? String(lead.score) : "",
    new Date(lead.createdAt).toISOString(),
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function patchLeadStage(id: string, stage: LeadStage) {
  const res = await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? "Failed to update lead stage");
  }
  return res.json();
}

const LEADS_QUERY_KEY = ["leads"] as const;

function LeadCard({
  lead,
  onStageChange,
}: {
  lead: BoardLead;
  onStageChange: (id: string, stage: LeadStage) => void;
}) {
  return (
    <GlassCard className="flex flex-col gap-3 p-unit-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-label-sm text-label-sm font-bold text-secondary">
            {initials(lead.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-label-sm text-label-sm font-bold text-on-surface">
              {lead.name || "Unnamed lead"}
            </p>
            {lead.phone && (
              <p className="truncate text-[12px] text-on-surface-variant">
                {lead.phone}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-mono-label text-[11px] font-bold",
            scoreBadgeClass(lead.score),
          )}
        >
          {lead.score ?? "—"}
        </span>
      </div>

      {lead.interestedService && (
        <p className="line-clamp-2 text-[13px] text-on-surface-variant">
          {lead.interestedService}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {lead.agent && (
            <span className="flex items-center gap-1 truncate rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
              <Icon name="smart_toy" className="size-3" />
              <span className="truncate">{lead.agent.name}</span>
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-on-surface-variant">
          {formatDate(lead.createdAt)}
        </span>
      </div>

      <Select
        value={lead.stage}
        onValueChange={(value) => onStageChange(lead.id, value as LeadStage)}
      >
        <SelectTrigger className="w-full" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STAGE_ORDER.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </GlassCard>
  );
}

export function LeadsBoardClient({
  initialLeads,
}: {
  initialLeads: BoardLead[];
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "ALL">("ALL");

  // Server-fetched data is the single source of truth; mutations update it
  // directly via the query cache for optimistic UI + rollback.
  const leads =
    queryClient.getQueryData<BoardLead[]>(LEADS_QUERY_KEY) ?? initialLeads;
  if (!queryClient.getQueryData<BoardLead[]>(LEADS_QUERY_KEY)) {
    queryClient.setQueryData(LEADS_QUERY_KEY, initialLeads);
  }

  const mutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      patchLeadStage(id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries({ queryKey: LEADS_QUERY_KEY });
      const previous = queryClient.getQueryData<BoardLead[]>(LEADS_QUERY_KEY);
      queryClient.setQueryData<BoardLead[]>(LEADS_QUERY_KEY, (old) =>
        (old ?? []).map((lead) =>
          lead.id === id ? { ...lead, stage } : lead,
        ),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(LEADS_QUERY_KEY, context.previous);
      }
      toast.error(
        err instanceof Error ? err.message : "Failed to update lead stage",
      );
    },
    onSuccess: (_data, variables) => {
      toast.success(
        `Lead moved to ${STAGE_LABELS[variables.stage]}`,
      );
    },
  });

  const handleStageChange = (id: string, stage: LeadStage) => {
    mutation.mutate({ id, stage });
  };

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (stageFilter !== "ALL" && lead.stage !== stageFilter) return false;
      if (!query) return true;
      return (
        (lead.name ?? "").toLowerCase().includes(query) ||
        (lead.phone ?? "").toLowerCase().includes(query) ||
        (lead.email ?? "").toLowerCase().includes(query)
      );
    });
  }, [leads, search, stageFilter]);

  const columns = useMemo(() => {
    const grouped = new Map<LeadStage, BoardLead[]>();
    for (const stage of STAGE_ORDER) grouped.set(stage, []);
    for (const lead of filteredLeads) {
      grouped.get(lead.stage)?.push(lead);
    }
    return grouped;
  }, [filteredLeads]);

  return (
    <div className="flex flex-col gap-unit-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email..."
              className="pl-9"
            />
          </div>
          <Select
            value={stageFilter}
            onValueChange={(value) =>
              setStageFilter(value as LeadStage | "ALL")
            }
          >
            <SelectTrigger className="w-full sm:w-44">
              <Icon name="filter_list" className="size-4 text-outline" />
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All stages</SelectItem>
              {STAGE_ORDER.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="default"
          onClick={() => downloadLeadsCsv(filteredLeads)}
          disabled={filteredLeads.length === 0}
        >
          <Icon name="download" data-icon="inline-start" />
          Export CSV
        </Button>
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon="person_search"
          title="No leads match your filters"
          description="Try a different search term or clear the stage filter."
        />
      ) : (
        <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-5">
          {STAGE_ORDER.map((stage) => {
            const stageLeads = columns.get(stage) ?? [];
            const styles = STAGE_COLUMN_STYLES[stage];
            return (
              <div key={stage} className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("size-2 rounded-full", styles.dot)}
                    />
                    <h3
                      className={cn(
                        "font-label-sm text-label-sm font-bold uppercase tracking-wide",
                        styles.header,
                      )}
                    >
                      {STAGE_LABELS[stage]}
                    </h3>
                  </div>
                  <span className="rounded-full bg-surface-container-low px-2 py-0.5 font-mono-label text-[11px] font-bold text-on-surface-variant">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {stageLeads.length === 0 ? (
                    <EmptyState
                      icon="group"
                      title="No leads"
                      className="p-unit-lg"
                    />
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onStageChange={handleStageChange}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
