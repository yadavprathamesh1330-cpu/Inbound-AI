"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui-custom/icon";
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

export type ContactType = "BROKER" | "CARRIER" | "DRIVER" | "SHIPPER" | "OTHER";

export interface ContactRow {
  id: string;
  type: ContactType;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  mcNumber: string | null;
  dotNumber: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
}

const TYPES: ContactType[] = ["BROKER", "CARRIER", "DRIVER", "SHIPPER", "OTHER"];
const TYPE_LABELS: Record<ContactType, string> = {
  BROKER: "Broker",
  CARRIER: "Carrier",
  DRIVER: "Driver",
  SHIPPER: "Shipper",
  OTHER: "Other",
};
const TYPE_BADGE: Record<ContactType, string> = {
  BROKER: "bg-secondary/10 text-secondary",
  CARRIER: "bg-emerald-500/10 text-emerald-600",
  DRIVER: "bg-amber-500/10 text-amber-600",
  SHIPPER: "bg-purple-500/10 text-purple-600",
  OTHER: "bg-surface-container-high text-on-surface-variant",
};

function emptyForm(): Record<string, string> {
  return {
    type: "BROKER",
    name: "",
    company: "",
    phone: "",
    email: "",
    mcNumber: "",
    dotNumber: "",
    city: "",
    state: "",
    notes: "",
  };
}

function formFromContact(c: ContactRow): Record<string, string> {
  return {
    type: c.type,
    name: c.name,
    company: c.company ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    mcNumber: c.mcNumber ?? "",
    dotNumber: c.dotNumber ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    notes: c.notes ?? "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-label-sm uppercase tracking-wider text-on-surface-variant">
        {label}
      </label>
      {children}
    </div>
  );
}

export function ContactsClient({
  initialContacts,
}: {
  initialContacts: ContactRow[];
}) {
  const [contacts, setContacts] = useState<ContactRow[]>(initialContacts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactType | "ALL">("ALL");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm());
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function openNew() {
    setEditing(null);
    setForm(emptyForm());
    setSheetOpen(true);
  }
  function openEdit(c: ContactRow) {
    setEditing(c);
    setForm(formFromContact(c));
    setSheetOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      const editingId = editing?.id;
      const res = await fetch(
        editingId ? `/api/contacts/${editingId}` : "/api/contacts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save contact.");
        return;
      }
      const saved: ContactRow = data.contact;
      setContacts((prev) =>
        editingId
          ? prev.map((c) => (c.id === editingId ? saved : c))
          : [saved, ...prev],
      );
      toast.success(editingId ? "Contact updated." : "Contact added.");
      setSheetOpen(false);
    } catch {
      toast.error("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    if (!confirm(`Delete ${editing.name}?`)) return;
    const res = await fetch(`/api/contacts/${editing.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Couldn't delete contact.");
      return;
    }
    setContacts((prev) => prev.filter((c) => c.id !== editing.id));
    toast.success("Contact deleted.");
    setSheetOpen(false);
  }

  const counts = useMemo(() => {
    const m: Record<string, number> = { ALL: contacts.length };
    for (const t of TYPES) m[t] = 0;
    for (const c of contacts) m[c.type] = (m[c.type] ?? 0) + 1;
    return m;
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (filter !== "ALL" && c.type !== filter) return false;
      if (!q) return true;
      return [c.name, c.company, c.phone, c.email, c.mcNumber, c.city]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [contacts, search, filter]);

  return (
    <div className="flex flex-col gap-unit-lg">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full sm:w-80">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, phone, MC…"
            className="pl-9"
          />
        </div>
        <Button onClick={openNew}>
          <Icon name="person_add" data-icon="inline-start" />
          Add Contact
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-label-md font-semibold transition-colors",
              filter === t
                ? "border-primary bg-primary/5 text-primary"
                : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high",
            )}
          >
            {t === "ALL" ? "All" : TYPE_LABELS[t]}
            <span className="ml-1.5 text-on-surface-variant">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="group"
          title={contacts.length === 0 ? "No contacts yet" : "No matches"}
          description={
            contacts.length === 0
              ? "Add brokers, carriers, and drivers to build your dispatch address book."
              : "Try a different search or filter."
          }
        />
      ) : (
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-outline-variant text-label-sm uppercase tracking-wider text-on-surface-variant">
                <th className="px-unit-lg py-unit-sm font-semibold">Name</th>
                <th className="px-unit-md py-unit-sm font-semibold">Type</th>
                <th className="px-unit-md py-unit-sm font-semibold">Phone</th>
                <th className="px-unit-md py-unit-sm font-semibold">Email</th>
                <th className="px-unit-md py-unit-sm font-semibold">MC / DOT</th>
                <th className="px-unit-lg py-unit-sm font-semibold">Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openEdit(c)}
                  className="cursor-pointer border-b border-outline-variant/50 text-body-md text-on-surface transition-colors hover:bg-surface-container-low"
                >
                  <td className="px-unit-lg py-unit-md">
                    <p className="font-medium">{c.name}</p>
                    {c.company && (
                      <p className="text-label-sm text-on-surface-variant">
                        {c.company}
                      </p>
                    )}
                  </td>
                  <td className="px-unit-md py-unit-md">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-label-sm font-semibold",
                        TYPE_BADGE[c.type],
                      )}
                    >
                      {TYPE_LABELS[c.type]}
                    </span>
                  </td>
                  <td className="px-unit-md py-unit-md font-mono text-label-md">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-unit-md py-unit-md text-on-surface-variant">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-unit-md py-unit-md text-on-surface-variant">
                    {[c.mcNumber && `MC ${c.mcNumber}`, c.dotNumber && `DOT ${c.dotNumber}`]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </td>
                  <td className="px-unit-lg py-unit-md text-on-surface-variant">
                    {[c.city, c.state].filter(Boolean).join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg">
          <SheetHeader className="border-b border-outline-variant/30 px-6 py-5">
            <SheetTitle className="text-headline-md font-headline-md text-on-surface">
              {editing ? "Edit Contact" : "Add Contact"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update this contact's details."
                : "Add a broker, carrier, driver, or shipper."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-unit-lg p-6">
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Type">
                <Select value={form.type} onValueChange={(v) => v && set("type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Name *">
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Carter" />
              </Field>
            </div>
            <Field label="Company">
              <Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Acme Logistics" />
            </Field>
            <div className="grid grid-cols-2 gap-unit-md">
              <Field label="Phone"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1…" /></Field>
              <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@acme.com" /></Field>
              <Field label="MC #"><Input value={form.mcNumber} onChange={(e) => set("mcNumber", e.target.value)} placeholder="123456" /></Field>
              <Field label="DOT #"><Input value={form.dotNumber} onChange={(e) => set("dotNumber", e.target.value)} placeholder="7654321" /></Field>
              <Field label="City"><Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Dallas" /></Field>
              <Field label="State"><Input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="TX" /></Field>
            </div>
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={3} placeholder="Preferred lanes, payment terms, etc." />
            </Field>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? "Saving…" : editing ? "Save changes" : "Add contact"}
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
