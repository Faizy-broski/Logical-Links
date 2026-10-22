"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyOptionSelect } from "@/components/ui/company-option-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  MAX_DOCUMENT_BYTES,
  openCarrierDocument,
  useAddCarrierDocument,
  useDeleteCarrierDocument,
  useUpdateCarrierDocument,
} from "@/hooks/use-carriers";
import { DOCUMENT_TYPES, DOCUMENT_WARNING_DAYS, expiryState, formatDay } from "@/lib/carrier-options";
import {
  DOCUMENT_VERIFICATION_META,
  DOCUMENT_VERIFICATION_STATUSES,
  type CarrierDocument,
  type DocumentVerificationStatus,
} from "@/types/api.types";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

type Draft = {
  key: string;
  documentType: string;
  issueDate: string;
  expiryDate: string;
  verificationStatus: DocumentVerificationStatus;
  notes: string;
};

function newDraft(): Draft {
  return { key: crypto.randomUUID(), documentType: "", issueDate: "", expiryDate: "", verificationStatus: "not_reviewed", notes: "" };
}

export function CarrierDocuments({
  carrierId,
  documents,
  canEdit,
}: {
  carrierId: string;
  documents: CarrierDocument[];
  canEdit: boolean;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const flagged = documents.filter((d) => {
    const s = expiryState(d.expiry_date);
    return s === "expired" || s === "soon";
  }).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-card-border px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Documents</h3>
          <p className="mt-0.5 text-xs text-muted">
            Insurance, authority, safety and other compliance files. Documents expiring within {DOCUMENT_WARNING_DAYS} days are flagged.
          </p>
        </div>
        {flagged > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            {flagged} need{flagged === 1 ? "s" : ""} attention
          </span>
        )}
      </div>

      <div className="space-y-3 p-6">
        {documents.length === 0 && drafts.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-card-border py-8 text-center">
            <FileText className="h-8 w-8 text-muted-light" />
            <p className="text-sm text-muted">No documents uploaded yet.</p>
          </div>
        )}

        {documents.map((doc) => (
          <DocumentRow key={doc.id} carrierId={carrierId} doc={doc} canEdit={canEdit} />
        ))}

        {drafts.map((draft) => (
          <NewDocumentForm
            key={draft.key}
            carrierId={carrierId}
            initial={draft}
            onDone={() => setDrafts((list) => list.filter((d) => d.key !== draft.key))}
          />
        ))}

        {canEdit && (
          <Button type="button" variant="outline" size="sm" onClick={() => setDrafts((list) => [...list, newDraft()])} className="rounded-lg">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {documents.length + drafts.length === 0 ? "Add Document" : "Add Another Document"}
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Existing document ───────────────────────────────────────────────────── */

function ExpiryFlag({ expiry }: { expiry: string | null }) {
  const state = expiryState(expiry);
  if (state === "expired") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700"><AlertTriangle className="h-3 w-3" />Expired</span>;
  }
  if (state === "soon") {
    return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"><AlertTriangle className="h-3 w-3" />Expires soon</span>;
  }
  return null;
}

function DocumentRow({ carrierId, doc, canEdit }: { carrierId: string; doc: CarrierDocument; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const deleteMut = useDeleteCarrierDocument(carrierId);
  const verification = DOCUMENT_VERIFICATION_META[doc.verification_status];

  async function open() {
    setOpening(true);
    try {
      await openCarrierDocument(carrierId, doc.id);
    } catch (err) {
      toast.error((err as Error).message ?? "Could not open the document");
    } finally {
      setOpening(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteMut.mutateAsync(doc.id);
      toast.success("Document deleted");
      setDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (editing) {
    return <EditDocumentForm carrierId={carrierId} doc={doc} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-xl border border-card-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{doc.document_type}</p>
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${verification.badge}`}>{verification.label}</span>
            <ExpiryFlag expiry={doc.expiry_date} />
          </div>
          <button
            type="button"
            onClick={open}
            disabled={opening}
            className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-60"
          >
            {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{doc.file_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </button>
          <p className="mt-1 text-xs text-muted">
            Issued {formatDay(doc.issue_date)} · Expires {formatDay(doc.expiry_date)} · Uploaded {formatDay(doc.created_at)}
          </p>
          {doc.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{doc.notes}</p>}
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-1">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setDeleteOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteMut.isPending}
        title="Delete document"
        description={<>Delete {doc.document_type} ({doc.file_name})? The uploaded file is removed permanently.</>}
        confirmLabel="Delete"
      />
    </div>
  );
}

/* ─── Forms ───────────────────────────────────────────────────────────────── */

function NewDocumentForm({ carrierId, initial, onDone }: { carrierId: string; initial: Draft; onDone: () => void }) {
  const addMut = useAddCarrierDocument(carrierId);
  return (
    <DocumentForm
      title="New document"
      initial={initial}
      fileRequired
      saving={addMut.isPending}
      onCancel={onDone}
      onSave={async (values, file) => {
        await addMut.mutateAsync({ file: file!, input: values });
        toast.success(`${values.documentType} uploaded`);
        onDone();
      }}
    />
  );
}

function EditDocumentForm({ carrierId, doc, onDone }: { carrierId: string; doc: CarrierDocument; onDone: () => void }) {
  const updateMut = useUpdateCarrierDocument(carrierId);
  return (
    <DocumentForm
      title="Edit document"
      currentFileName={doc.file_name}
      initial={{
        key: doc.id,
        documentType: doc.document_type,
        issueDate: doc.issue_date ?? "",
        expiryDate: doc.expiry_date ?? "",
        verificationStatus: doc.verification_status,
        notes: doc.notes ?? "",
      }}
      saving={updateMut.isPending}
      onCancel={onDone}
      onSave={async (values, file) => {
        await updateMut.mutateAsync({ documentId: doc.id, file, input: values });
        toast.success("Document updated");
        onDone();
      }}
    />
  );
}

function DocumentForm({
  title,
  initial,
  currentFileName,
  fileRequired = false,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  initial: Draft;
  currentFileName?: string;
  fileRequired?: boolean;
  saving: boolean;
  onSave: (values: Omit<Draft, "key">, file: File | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_DOCUMENT_BYTES) {
      toast.error("Files must be 20 MB or smaller");
      return;
    }
    setFile(f);
  }

  async function submit() {
    if (!values.documentType) return void toast.error("Choose a document type");
    if (fileRequired && !file) return void toast.error("Choose a file to upload");
    if (values.issueDate && values.expiryDate && values.expiryDate < values.issueDate) {
      return void toast.error("Expiry date can't be before the issue date");
    }
    const { key: _key, ...rest } = values;
    try {
      await onSave({ ...rest, notes: rest.notes.trim() }, file);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save document");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{title}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Document type *</Label>
          <CompanyOptionSelect value={values.documentType} onChange={(v) => set("documentType", v)} options={DOCUMENT_TYPES} placeholder="Select document type" />
        </div>

        <div className="space-y-1.5">
          <Label>{currentFileName ? "Replace file" : "Upload file *"}</Label>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} className="h-9 w-full justify-start rounded-lg font-normal">
            <Upload className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{file?.name ?? currentFileName ?? "Choose file (PDF, image or Word, max 20 MB)"}</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`issue-${initial.key}`}>Issue date</Label>
          <Input id={`issue-${initial.key}`} type="date" value={values.issueDate} onChange={(e) => set("issueDate", e.target.value)} className="rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`expiry-${initial.key}`}>Expiry date</Label>
          <Input id={`expiry-${initial.key}`} type="date" value={values.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className="rounded-lg" />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label>Verification status</Label>
          <SearchableSelect
            value={values.verificationStatus}
            onValueChange={(v) => set("verificationStatus", v as DocumentVerificationStatus)}
            options={DOCUMENT_VERIFICATION_STATUSES.map((s) => ({ value: s, label: DOCUMENT_VERIFICATION_META[s].label }))}
            placeholder="Select status"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`notes-${initial.key}`}>Notes</Label>
          <Textarea id={`notes-${initial.key}`} rows={2} maxLength={2000} placeholder="Optional comments about this document" value={values.notes} onChange={(e) => set("notes", e.target.value)} className="rounded-lg" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button type="button" size="sm" onClick={submit} disabled={saving} className="bg-primary text-sidebar hover:bg-primary/85">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save document"}
        </Button>
      </div>
    </div>
  );
}
