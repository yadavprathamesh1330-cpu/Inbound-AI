"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
import { GlassCard } from "@/components/ui-custom/glass-card";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type LoadStatus =
  | "NEW"
  | "BOOKED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export interface BoardLoad {
  id: string;
  status: LoadStatus;
  reference: string | null;
  originCity: string | null;
  originState: string | null;
  destCity: string | null;
  destState: string | null;
  equipment: string | null;
  weightLbs: number | null;
  commodity: string | null;
  rateCents: number | null;
  pickupDate: string | null;
  deliveryDate: string | null;
  brokerName: string | null;
  brokerMc: string | null;
  brokerPhone: string | null;
  rateConUrl: string | null;
  notes: string | null;
  agentId: string | null;
  agentName: string | null;
  createdAt: string;
}

const STATUS_ORDER: LoadStatus[] = [
  "NEW",
  "BOOKED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_LABELS: Record<LoadStatus, string> = {
  NEW: "New",
  BOOKED: "Booked",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<LoadStatus, { dot: string; header: string }> = {
  NEW: { dot: "bg-slate-400", header: "text-slate-600" },
  BOOKED: { dot: "bg-secondary", header: "text-secondary" },
  IN_TRANSIT: { dot: "bg-amber-500", header: "text-amber-600" },
  DELIVERED: { dot: "bg-emerald-500", header: "text-emerald-600" },
  CANCELLED: { dot: "bg-destructive", header: "text-destructive" },
};

const EQUIPMENT = [
  "Dry Van",
  "Reefer",
  "Flatbed",
  "Step Deck",
  "Power Only",
  "Box Truck",
  "Hotshot",
];

function usd(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function lane(l: BoardLoad): string {
  const from = [l.originCity, l.originState].filter(Boolean).join(", ");
  const to = [l.destCity, l.destState].filter(Boolean).join(", ");
  if (!from && !to) return "Lane TBD";
  return `${from || "?"} → ${to || "?"}`;
}

function shortDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function emptyForm(): Record<string, string> {
  return {
    reference: "",
    originCity: "",
    originState: "",
    destCity: "",
    destState: "",
    equipment: "",
    weightLbs: "",
    commodity: "",
    rateDollars: "",
    pickupDate: "",
    deliveryDate: "",
    brokerName: "",
    brokerMc: "",
    brokerPhone: "",
    rateConUrl: "",
    notes: "",
    agentId: "",
    status: "NEW",
  };
}

function formFromLoad(l: BoardLoad): Record<string, string> {
  return {
    reference: l.reference ?? "",
    originCity: l.originCity ?? "",
    originState: l.originState ?? "",
    destCity: l.destCity ?? "",
    destState: l.destState ?? "",
    equipment: l.equipment ?? "",
    weightLbs: l.weightLbs != null ? String(l.weightLbs) : "",
    commodity: l.commodity ?? "",
    rateDollars: l.rateCents != null ? String(l.rateCents / 100) : "",
    pickupDate: l.pickupDate ? l.pickupDate.slice(0, 10) : "",
    deliveryDate: l.deliveryDate ? l.deliveryDate.slice(0, 10) : "",
    brokerName: l.brokerName ?? "",
    brokerMc: l.brokerMc ?? "",
    brokerPhone: l.brokerPhone ?? "",
    rateConUrl: l.rateConUrl ?? "",
    notes: l.notes ?? "",
    agentId: l.agentId ?? "",
    status: l.status,
  };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

export function LoadsBoardClient({
  initialLoads,
  agents,
}: {
  initialLoads: BoardLoad[];
  agents: { id: string; name: string }[];
}) {
  const [loads, setLoads] = useState<BoardLoad[]>(initialLoads);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BoardLoad | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm());
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }

  function openEdit(l: BoardLoad) {
    setEditing(l);
    setForm(formFromLoad(l));
    setSheetOpen(true);
  }

  function toPayload() {
    return {
      reference: form.reference,
      originCity: form.originCity,
      originState: form.originState,
      destCity: form.destCity,
      destState: form.destState,
      equipment: form.equipment,
      commodity: form.commodity,
      weightLbs: form.weightLbs ? Number(form.weightLbs) : null,
      rateDollars: form.rateDollars ? Number(form.rateDollars) : null,
      pickupDate: form.pickupDate,
      deliveryDate: form.deliveryDate,
      brokerName: form.brokerName,
      brokerMc: form.brokerMc,
      brokerPhone: form.brokerPhone,
      rateConUrl: form.rateConUrl,
      notes: form.notes,
      agentId: form.agentId || undefined,
      status: form.status as LoadStatus,
    };
  }

  async function save() {
    setSaving(true);
    try {
      const editingId = editing?.id;
      const res = await fetch(
        editingId ? `/api/loads/${editingId}` : "/api/loads",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(toPayload()),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save the load.");
        return;
      }
      const saved: BoardLoad = {
        ...data.load,
        pickupDate: data.load.pickupDate ?? null,
        deliveryDate: data.load.deliveryDate ?? null,
        createdAt: data.load.createdAt,
        agentName: data.load.agent?.name ?? null,
      };
      setLoads((prev) =>
        editingId
          ? prev.map((l) => (l.id === editingId ? saved : l))
          : [saved, ...prev],
      );
      toast.success(editingId ? "Load updated." : "Load created.");
      setSheetOpen(false);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function moveStatus(id: string, status: LoadStatus) {
    const prev = loads;
    setLoads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
    const res = await fetch(`/api/loads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setLoads(prev);
      toast.error("Couldn't move the load.");
      return;
    }
    toast.success(`Moved to ${STATUS_LABELS[status]}`);
  }

  async function remove() {
    if (!editing) return;
    if (!confirm("Delete this load? This can't be undone.")) return;
    const res = await fetch(`/api/loads/${editing.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete the load.");
      return;
    }
    setLoads((prev) => prev.filter((l) => l.id !== editing.id));
    toast.success("Load deleted.");
    setSheetOpen(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return loads;
    return loads.filter((l) =>
      [
        l.reference,
        l.originCity,
        l.destCity,
        l.brokerName,
        l.equipment,
        l.commodity,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [loads, search]);

  const columns = useMemo(() => {
    const grouped = new Map<LoadStatus, BoardLoad[]>();
    for (const s of STATUS_ORDER) grouped.set(s, []);
    for (const l of filtered) grouped.get(l.status)?.push(l);
    return grouped;
  }, [filtered]);

  return (
    <div className="flex flex-col gap-unit-lg">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full sm:w-96">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by lane, broker, ref, equipment…"
            className="pl-9"
          />
        </div>
        <Button onClick={openNew}>
          <Icon name="add" data-icon="inline-start" />
          Add Load
        </Button>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-5">
        {STATUS_ORDER.map((status) => {
          const items = columns.get(status) ?? [];
          const styles = STATUS_STYLES[status];
          return (
            <div key={status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", styles.dot)} />
                  <h3
                    className={cn(
                      "text-label-sm font-bold uppercase tracking-wide",
                      styles.header,
                    )}
                  >
                    {STATUS_LABELS[status]}
                  </h3>
                </div>
                <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                  {items.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/60 p-unit-md text-center text-[12px] text-on-surface-variant">
                    No loads
                  </div>
                ) : (
                  items.map((l) => (
                    <GlassCard
                      key={l.id}
                      className="flex cursor-pointer flex-col gap-2 p-unit-sm transition-transform hover:scale-[1.01]"
                      onClick={() => openEdit(l)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-label-md font-bold text-on-surface">
                          {lane(l)}
                        </p>
                        <span className="shrink-0 text-label-md font-bold text-emerald-600">
                          {usd(l.rateCents)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-on-surface-variant">
                        {l.equipment && (
                          <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-medium">
                            {l.equipment}
                          </span>
                        )}
                        {l.weightLbs != null && (
                          <span>{l.weightLbs.toLocaleString()} lbs</span>
                        )}
                        {l.pickupDate && (
                          <span className="flex items-center gap-0.5">
                            <Icon name="calendar_today" className="size-3" />
                            {shortDate(l.pickupDate)}
                          </span>
                        )}
                      </div>
                      {l.brokerName && (
                        <p className="truncate text-[12px] text-on-surface-variant">
                          <Icon
                            name="business"
                            className="mr-1 inline size-3"
                          />
                          {l.brokerName}
                        </p>
                      )}
                      <div onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={l.status}
                          onValueChange={(v) =>
                            v && moveStatus(l.id, v as LoadStatus)
                          }
                        >
                          <SelectTrigger className="w-full" size="sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.map((s) => (
                              <SelectItem key={s} value={s}>
                                {STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loads.length === 0 && (
        <EmptyState
          icon="local_shipping"
          title="No loads yet"
          description="Add your first load, or they'll appear here automatically as your dispatch agent books them."
        />
      )}

      {/* Add / edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-outline-variant/30 px-6 py-5">
            <SheetTitle className="text-headline-md font-headline-md text-on-surface">
              {editing ? "Edit Load" : "Add Load"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update this load's details and status."
                : "Log a new load onto the dispatch board."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-unit-lg p-6">
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Reference #">
                <Input value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="LD-1042" />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => v && set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <p className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Lane</p>
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Origin City"><Input value={form.originCity} onChange={(e) => set("originCity", e.target.value)} placeholder="Dallas" /></Field>
              <Field label="Origin State"><Input value={form.originState} onChange={(e) => set("originState", e.target.value)} placeholder="TX" /></Field>
              <Field label="Dest City"><Input value={form.destCity} onChange={(e) => set("destCity", e.target.value)} placeholder="Atlanta" /></Field>
              <Field label="Dest State"><Input value={form.destState} onChange={(e) => set("destState", e.target.value)} placeholder="GA" /></Field>
            </div>

            <p className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Freight</p>
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Equipment">
                <Select value={form.equipment} onValueChange={(v) => v && set("equipment", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Weight (lbs)"><Input type="number" value={form.weightLbs} onChange={(e) => set("weightLbs", e.target.value)} placeholder="42000" /></Field>
              <Field label="Commodity"><Input value={form.commodity} onChange={(e) => set("commodity", e.target.value)} placeholder="Produce" /></Field>
              <Field label="Rate (all-in $)"><Input type="number" value={form.rateDollars} onChange={(e) => set("rateDollars", e.target.value)} placeholder="2850" /></Field>
              <Field label="Pickup Date"><Input type="date" value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} /></Field>
              <Field label="Delivery Date"><Input type="date" value={form.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} /></Field>
            </div>

            <p className="text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Broker / Shipper</p>
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Broker Name"><Input value={form.brokerName} onChange={(e) => set("brokerName", e.target.value)} placeholder="Acme Logistics" /></Field>
              <Field label="MC #"><Input value={form.brokerMc} onChange={(e) => set("brokerMc", e.target.value)} placeholder="123456" /></Field>
              <Field label="Broker Phone"><Input value={form.brokerPhone} onChange={(e) => set("brokerPhone", e.target.value)} placeholder="+1…" /></Field>
              <Field label="Rate Con (link)"><Input value={form.rateConUrl} onChange={(e) => set("rateConUrl", e.target.value)} placeholder="https://…" /></Field>
            </div>

            <Field label="Assigned Agent">
              <Select value={form.agentId} onValueChange={(v) => set("agentId", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder={agents.length ? "Choose an agent" : "No agents yet"} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Any special instructions…" rows={3} />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? "Saving…" : editing ? "Save changes" : "Create load"}
              </Button>
              {editing && (
                <Button variant="outline" onClick={remove} className="text-destructive">
                  <Icon name="delete" data-icon="inline-start" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
