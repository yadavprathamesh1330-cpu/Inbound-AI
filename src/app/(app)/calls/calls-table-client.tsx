"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { Icon } from "@/components/ui-custom/icon";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Call, CallStatus } from "@/generated/prisma/client";

type CallWithAgent = Call & { agent: { name: string } };

const STATUS_FILTERS: { label: string; value: CallStatus | "ALL" }[] = [
  { label: "All statuses", value: "ALL" },
  { label: "Completed", value: "COMPLETED" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Missed", value: "MISSED" },
  { label: "Voicemail", value: "VOICEMAIL" },
];

const STATUS_STYLES: Record<CallStatus, string> = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  IN_PROGRESS: "bg-secondary/10 text-secondary border border-secondary/20",
  FAILED: "bg-error-container text-on-error-container border border-error/10",
  MISSED: "bg-error-container text-on-error-container border border-error/10",
  VOICEMAIL: "bg-amber-50 text-amber-700 border border-amber-100",
};

const STATUS_LABELS: Record<CallStatus, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In Progress",
  FAILED: "Failed",
  MISSED: "Missed",
  VOICEMAIL: "Voicemail",
};

function scoreBadgeClass(score: number | null) {
  if (score === null) return "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30";
  if (score >= 75) return "bg-emerald-50 text-emerald-700 border border-emerald-100";
  if (score >= 40) return "bg-amber-50 text-amber-700 border border-amber-100";
  return "bg-error-container text-on-error-container border border-error/10";
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function StatusPill({ status }: { status: CallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        STATUS_STYLES[status],
      )}
    >
      {status === "IN_PROGRESS" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

interface TranscriptTurn {
  speaker: string;
  text: string;
}

function parseTranscript(transcript: unknown): TranscriptTurn[] {
  if (!Array.isArray(transcript)) return [];
  return transcript.filter(
    (t): t is TranscriptTurn =>
      typeof t === "object" &&
      t !== null &&
      typeof (t as TranscriptTurn).speaker === "string" &&
      typeof (t as TranscriptTurn).text === "string",
  );
}

const SENTIMENT_META: Record<
  NonNullable<Call["sentiment"]>,
  { label: string; icon: string; className: string }
> = {
  POSITIVE: {
    label: "Positive",
    icon: "sentiment_satisfied",
    className: "text-emerald-600",
  },
  NEUTRAL: {
    label: "Neutral",
    icon: "sentiment_neutral",
    className: "text-amber-600",
  },
  NEGATIVE: {
    label: "Negative",
    icon: "sentiment_dissatisfied",
    className: "text-error",
  },
};

function CallDetailContent({ call }: { call: CallWithAgent }) {
  const transcript = useMemo(() => parseTranscript(call.transcript), [call.transcript]);
  const sentimentMeta = call.sentiment ? SENTIMENT_META[call.sentiment] : null;

  return (
    <div className="flex flex-1 flex-col gap-unit-lg overflow-y-auto custom-scrollbar px-6 pb-6">
      {/* Overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
            Duration
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-on-surface">
            {formatDuration(call.durationSeconds)}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
            Lead score
          </p>
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-bold",
              scoreBadgeClass(call.leadScore),
            )}
          >
            {call.leadScore ?? "—"}
          </span>
        </div>
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
            Sentiment
          </p>
          {sentimentMeta ? (
            <p className={cn("mt-1 flex items-center gap-1 text-sm font-semibold", sentimentMeta.className)}>
              <Icon name={sentimentMeta.icon} className="size-4" />
              {sentimentMeta.label}
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-on-surface-variant">—</p>
          )}
        </div>
        <div className="rounded-xl bg-surface-container-low p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
            Status
          </p>
          <div className="mt-1">
            <StatusPill status={call.status} />
          </div>
        </div>
      </div>

      {/* Summary */}
      {call.summary && (
        <section>
          <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
            AI Summary
          </h4>
          <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
            {call.summary}
          </p>
        </section>
      )}

      {/* Extracted fields */}
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Extracted details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-outline">Name</p>
            <p className="text-sm font-medium text-on-surface">
              {call.extractedName ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-outline">Email</p>
            <p className="text-sm font-medium text-on-surface">
              {call.extractedEmail ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-outline">Budget</p>
            <p className="text-sm font-medium text-on-surface">
              {call.extractedBudget ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-outline">Interested service</p>
            <p className="text-sm font-medium text-on-surface">
              {call.extractedInterestedService ?? "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] text-outline">Next action</p>
            <p className="text-sm font-medium text-on-surface">
              {call.nextAction ?? "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Transcript */}
      <section>
        <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Transcript
        </h4>
        {transcript.length === 0 ? (
          <p className="rounded-xl bg-surface-container-low p-3 text-sm text-on-surface-variant">
            No transcript available for this call.
          </p>
        ) : (
          <div className="space-y-3">
            {transcript.map((turn, i) => {
              const isAgent = turn.speaker.toLowerCase() === "agent";
              return (
                <div
                  key={i}
                  className={cn("flex", isAgent ? "justify-start" : "justify-end")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                      isAgent
                        ? "rounded-tl-sm bg-surface-container-low text-on-surface"
                        : "rounded-tr-sm bg-primary text-primary-foreground",
                    )}
                  >
                    <p
                      className={cn(
                        "mb-0.5 text-[10px] font-bold uppercase tracking-wider",
                        isAgent ? "text-outline" : "text-primary-foreground/60",
                      )}
                    >
                      {turn.speaker}
                    </p>
                    <p className="leading-relaxed">{turn.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CallDetailSheet({
  call,
  open,
  onOpenChange,
  onDelete,
}: {
  call: CallWithAgent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (call: CallWithAgent) => void;
}) {
  if (!call) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-outline-variant/30 px-6 py-5">
          <SheetTitle className="text-headline-md font-headline-md text-on-surface">
            {call.callerName || "Unknown caller"}
          </SheetTitle>
          <SheetDescription className="font-mono text-xs">
            {call.callerPhone} &middot; {call.agent.name} &middot;{" "}
            {format(new Date(call.startedAt), "MMM d, yyyy 'at' h:mm a")}
          </SheetDescription>
        </SheetHeader>

        <CallDetailContent call={call} />

        <div className="flex items-center gap-2 border-t border-outline-variant/30 bg-surface px-6 py-4">
          {call.recordingUrl ? (
            <audio controls src={call.recordingUrl} className="h-9 max-w-[55%] flex-1" />
          ) : (
            <Button variant="outline" size="sm" disabled className="flex-1">
              <Icon name="play_circle" className="mr-1.5 size-4" />
              No recording available
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!call.recordingUrl}
            render={
              call.recordingUrl ? (
                <a href={call.recordingUrl} download />
              ) : undefined
            }
          >
            <Icon name="download" className="mr-1.5 size-4" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(call)}
          >
            <Icon name="delete" className="mr-1.5 size-4" />
            Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CallsTableClient({
  initialCalls,
}: {
  initialCalls: CallWithAgent[];
}) {
  const [calls, setCalls] = useState(initialCalls);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CallStatus | "ALL">("ALL");
  const [selectedCall, setSelectedCall] = useState<CallWithAgent | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CallWithAgent | null>(null);

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/calls/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete call");
      }
      return res.json();
    },
    onSuccess: (_data, id) => {
      setCalls((prev) => prev.filter((c) => c.id !== id));
      setDetailOpen(false);
      setPendingDelete(null);
      toast.success("Call deleted");
      queryClient.invalidateQueries({ queryKey: ["calls"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete call");
    },
  });

  const filteredCalls = useMemo(() => {
    const query = search.trim().toLowerCase();
    return calls.filter((call) => {
      const matchesStatus = statusFilter === "ALL" || call.status === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      const name = (call.callerName ?? "").toLowerCase();
      const phone = call.callerPhone.toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [calls, search, statusFilter]);

  function openDetail(call: CallWithAgent) {
    setSelectedCall(call);
    setDetailOpen(true);
  }

  return (
    <div className="glass-card overflow-hidden p-0">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-outline-variant/30 p-unit-md">
        <div className="relative min-w-[220px] flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by caller name or phone…"
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as CallStatus | "ALL")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="ml-auto text-xs font-medium text-outline">
          {filteredCalls.length} of {calls.length} calls
        </p>
      </div>

      {filteredCalls.length === 0 ? (
        <EmptyState
          icon="search"
          title="No calls match your filters"
          description="Try a different search term or reset the status filter."
          className="border-0"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-outline-variant/30 hover:bg-transparent">
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Caller
              </TableHead>
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Agent
              </TableHead>
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Time
              </TableHead>
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Duration
              </TableHead>
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Summary
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Score
              </TableHead>
              <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                Status
              </TableHead>
              <TableHead className="px-6 py-3" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCalls.map((call) => (
              <TableRow
                key={call.id}
                onClick={() => openDetail(call)}
                className="cursor-pointer border-outline-variant/20"
              >
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary">
                      {initialsOf(call.callerName || call.callerPhone)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">
                        {call.callerName || "Unknown caller"}
                      </p>
                      <p className="font-mono text-[11px] text-outline">
                        {call.callerPhone}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Icon name="smart_toy" className="size-4 text-primary" />
                    <span className="text-sm font-medium text-on-surface">
                      {call.agent.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className="px-6 py-4 text-sm text-on-surface-variant"
                  title={format(new Date(call.startedAt), "MMM d, yyyy h:mm a")}
                >
                  {formatDistanceToNow(new Date(call.startedAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="px-6 py-4 font-mono text-sm text-on-surface-variant">
                  {formatDuration(call.durationSeconds)}
                </TableCell>
                <TableCell className="max-w-[240px] px-6 py-4">
                  <p className="truncate text-sm text-on-surface-variant">
                    {call.summary ?? "—"}
                  </p>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold",
                      scoreBadgeClass(call.leadScore),
                    )}
                  >
                    {call.leadScore ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <StatusPill status={call.status} />
                </TableCell>
                <TableCell className="px-6 py-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(call);
                    }}
                    aria-label="View call detail"
                  >
                    <Icon name="visibility" className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CallDetailSheet
        call={selectedCall}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={(call) => setPendingDelete(call)}
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this call?</DialogTitle>
            <DialogDescription>
              This will permanently remove the call record
              {pendingDelete ? ` for ${pendingDelete.callerName || pendingDelete.callerPhone}` : ""}
              , including its transcript and recording link. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
