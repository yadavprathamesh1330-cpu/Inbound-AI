"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Icon } from "@/components/ui-custom/icon";
import { EmptyState } from "@/components/ui-custom/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  Agent,
  KnowledgeDocument,
  KnowledgeSourceType,
  KnowledgeStatus,
} from "@/generated/prisma/client";

type DocumentWithAgent = KnowledgeDocument & {
  agent: { id: string; name: string } | null;
};

type AgentOption = Pick<Agent, "id" | "name">;

const SOURCE_TYPE_META: Record<
  KnowledgeSourceType,
  { icon: string; label: string; iconClassName: string }
> = {
  PDF: { icon: "picture_as_pdf", label: "PDF Document", iconClassName: "bg-red-50 text-red-600" },
  DOCX: { icon: "description", label: "DOCX Document", iconClassName: "bg-secondary/10 text-secondary" },
  TXT: { icon: "article", label: "Text Document", iconClassName: "bg-surface-container-highest text-on-surface-variant" },
  WEBSITE: { icon: "language", label: "Website Crawl", iconClassName: "bg-blue-50 text-blue-600" },
  FAQ: { icon: "help", label: "FAQ", iconClassName: "bg-amber-50 text-amber-600" },
};

const STATUS_STYLES: Record<KnowledgeStatus, string> = {
  PENDING: "bg-surface-container-highest text-on-surface-variant border border-outline-variant/30",
  INDEXING: "bg-secondary/10 text-secondary border border-secondary/20",
  READY: "bg-emerald-50 text-emerald-700 border border-emerald-100",
  FAILED: "bg-error-container text-on-error-container border border-error/10",
};

const STATUS_LABELS: Record<KnowledgeStatus, string> = {
  PENDING: "Pending",
  INDEXING: "Indexing…",
  READY: "Ready",
  FAILED: "Failed",
};

function StatusPill({ status }: { status: KnowledgeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        STATUS_STYLES[status],
      )}
    >
      {status === "INDEXING" && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-secondary" />
        </span>
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatBytes(bytes: number | null) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function UploadDialog({
  agents,
  open,
  onOpenChange,
  onCreate,
  isPending,
}: {
  agents: AgentOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    title: string;
    sourceType: KnowledgeSourceType;
    sourceUrl?: string;
    agentId?: string | null;
  }) => void;
  isPending: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"file" | "website" | "faq">("file");
  const [fileTab, setFileTab] = useState<"PDF" | "DOCX" | "TXT">("PDF");
  const [fileName, setFileName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [agentId, setAgentId] = useState<string>("ALL");

  function reset() {
    setActiveTab("file");
    setFileName("");
    setWebsiteUrl("");
    setFaqQuestion("");
    setFaqAnswer("");
    setAgentId("ALL");
  }

  const resolvedAgentId = agentId === "ALL" ? null : agentId;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button className="gap-2 rounded-[14px] px-unit-md py-3 font-label-sm text-label-sm font-bold" />
        }
      >
        <Icon name="add" className="size-4" />
        Upload New Source
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a knowledge source</DialogTitle>
          <DialogDescription>
            Upload a document, crawl a website, or add an FAQ pair to train
            your agents.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="file" className="flex-1">
              File
            </TabsTrigger>
            <TabsTrigger value="website" className="flex-1">
              Website Crawl
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex-1">
              FAQ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4 pt-3">
            <Tabs
              value={fileTab}
              onValueChange={(v) => setFileTab(v as typeof fileTab)}
            >
              <TabsList>
                <TabsTrigger value="PDF">PDF</TabsTrigger>
                <TabsTrigger value="DOCX">DOCX</TabsTrigger>
                <TabsTrigger value="TXT">TXT</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="space-y-2">
              <Label htmlFor="kb-file">File</Label>
              {/* No S3/Supabase Storage wired up yet - this only records the
                  filename as the document title. Real file bytes need
                  Supabase Storage/S3 wired in before this actually persists
                  file content. */}
              <Input
                id="kb-file"
                type="file"
                accept={
                  fileTab === "PDF"
                    ? ".pdf"
                    : fileTab === "DOCX"
                      ? ".docx"
                      : ".txt"
                }
                onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              />
              <p className="text-xs text-on-surface-variant">
                Storage isn&apos;t wired up yet - we&apos;ll just record the
                filename for now.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="website" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="kb-url">Website URL</Label>
              <Input
                id="kb-url"
                type="url"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label htmlFor="kb-faq-q">Question</Label>
              <Input
                id="kb-faq-q"
                placeholder="What are your business hours?"
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kb-faq-a">Answer</Label>
              <Textarea
                id="kb-faq-a"
                placeholder="We're open Monday-Friday, 9am-6pm."
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="kb-agent">Attach to agent</Label>
          <Select
            value={agentId}
            onValueChange={(value) => setAgentId(value ?? "ALL")}
          >
            <SelectTrigger id="kb-agent" className="w-full">
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={() => {
              if (activeTab === "faq") {
                if (!faqQuestion.trim() || !faqAnswer.trim()) {
                  toast.error("Fill in both the question and answer");
                  return;
                }
                onCreate({
                  title: faqQuestion.trim(),
                  sourceType: "FAQ",
                  sourceUrl: faqAnswer.trim(),
                  agentId: resolvedAgentId,
                });
                return;
              }
              if (activeTab === "website") {
                if (!websiteUrl.trim()) {
                  toast.error("Enter a website URL to crawl");
                  return;
                }
                onCreate({
                  title: websiteUrl.trim(),
                  sourceType: "WEBSITE",
                  sourceUrl: websiteUrl.trim(),
                  agentId: resolvedAgentId,
                });
                return;
              }
              if (!fileName.trim()) {
                toast.error("Choose a file to upload");
                return;
              }
              onCreate({
                title: fileName.trim(),
                sourceType: fileTab,
                agentId: resolvedAgentId,
              });
            }}
          >
            {isPending ? "Adding…" : "Add source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function KnowledgeBaseClient({
  initialDocuments,
  agents,
}: {
  initialDocuments: DocumentWithAgent[];
  agents: AgentOption[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DocumentWithAgent | null>(null);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      sourceType: KnowledgeSourceType;
      sourceUrl?: string;
      agentId?: string | null;
    }) => {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to add source");
      }
      return res.json() as Promise<DocumentWithAgent>;
    },
    onSuccess: (document) => {
      setDocuments((prev) => [document, ...prev]);
      setUploadOpen(false);
      toast.success("Knowledge source added");
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add source");
    },
  });

  const reindexMutation = useMutation({
    mutationFn: async (id: string) => {
      // Optimistically flip to INDEXING right away for the "live" pulse.
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "INDEXING" } : d)),
      );
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to re-index document");
      }
      return res.json() as Promise<DocumentWithAgent>;
    },
    onSuccess: (document) => {
      setDocuments((prev) => prev.map((d) => (d.id === document.id ? document : d)));
      toast.success("Re-indexed successfully");
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to re-index document");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete document");
      }
      return res.json();
    },
    onSuccess: (_data, id) => {
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setPendingDelete(null);
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return documents;
    return documents.filter((doc) => doc.title.toLowerCase().includes(query));
  }, [documents, search]);

  return (
    <div className="space-y-unit-lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-outline"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge base…"
            className="pl-9"
          />
        </div>
        <UploadDialog
          agents={agents}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onCreate={(payload) => createMutation.mutate(payload)}
          isPending={createMutation.isPending}
        />
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon="database"
          title="No knowledge sources yet"
          description="Upload a document, crawl a website, or add an FAQ to start training your agents."
          action={
            <Button onClick={() => setUploadOpen(true)}>
              <Icon name="add" className="mr-1.5 size-4" />
              Upload New Source
            </Button>
          }
        />
      ) : (
        <div className="glass-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low/50 p-unit-md">
            <span className="text-label-sm font-label-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Existing Knowledge Sources
            </span>
            <p className="text-xs font-medium text-outline">
              {filteredDocuments.length} of {documents.length}
            </p>
          </div>

          {filteredDocuments.length === 0 ? (
            <EmptyState
              icon="search"
              title="No documents match your search"
              description="Try a different search term."
              className="border-0"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-outline-variant/30 hover:bg-transparent">
                  <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Title
                  </TableHead>
                  <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Agent
                  </TableHead>
                  <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Chunks
                  </TableHead>
                  <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Size
                  </TableHead>
                  <TableHead className="px-6 py-3 text-label-sm font-label-sm uppercase tracking-wider text-outline">
                    Status
                  </TableHead>
                  <TableHead className="px-6 py-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const meta = SOURCE_TYPE_META[doc.sourceType];
                  return (
                    <TableRow key={doc.id} className="border-outline-variant/20">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-lg",
                              meta.iconClassName,
                            )}
                          >
                            <Icon name={meta.icon} className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-on-surface">
                              {doc.title}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                              {meta.label} · Added{" "}
                              {formatDistanceToNow(new Date(doc.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-on-surface-variant">
                        {doc.agent?.name ?? "All agents"}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-sm text-on-surface-variant">
                        {doc.chunkCount}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-on-surface-variant">
                        {formatBytes(doc.sizeBytes)}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusPill status={doc.status} />
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Re-index document"
                            disabled={
                              doc.status === "INDEXING" ||
                              reindexMutation.isPending
                            }
                            onClick={() => reindexMutation.mutate(doc.id)}
                          >
                            <Icon
                              name="sync"
                              className={cn(
                                "size-4",
                                doc.status === "INDEXING" && "animate-spin",
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete document"
                            onClick={() => setPendingDelete(doc)}
                          >
                            <Icon name="delete" className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this document?</DialogTitle>
            <DialogDescription>
              This will permanently remove
              {pendingDelete ? ` "${pendingDelete.title}"` : " this document"}{" "}
              from your knowledge base. This action cannot be undone.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
